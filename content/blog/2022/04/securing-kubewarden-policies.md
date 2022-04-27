---
title: Secure Supply Chain with Kubewarden: securing Kubewarden policies
authors:
- Víctor Cuadrado Juan
date: 2022-04-21
lastmod: 2022-04-21
---

With the recent releases, Kubewarden stack is now gaining support for 
verifying the integrity and authenticity of contents using the
[Sigstore project](https://www.sigstore.dev/).

In this post, we focus on Kubewarden Policies and how to create a Secure Supply
Chain for them.

## Sigstore?

Since a full Sigstore dive is not for this post, we recommend [their nice docs](https://docs.sigstore.dev).

In short, Sigstore provides an automatable workflow thought out to match the
distributed Open Source development model. The workflow specifies how to
digitally sign and verify artifacts; in our case, Kubewarden Policies. It also provides a
transparency log to monitor such signatures. The workflow allows to sign
artifacts with traditional Public-Private key pairs, or sign in Keyless mode.

Keyless mode is interesting: signatures are created with short-lived certs
with an OpenID Connect (OIDC) service as issuer, and with Sigstore's CA
([Fulcio](https://github.com/sigstore/fulcio)) as root CA.

The OpenID Connect service (SSO via your own Okta instance, Github, Google, etc)
proves to Fulcio that you are who you say you are, and creates the short-lived
certificate. This certificate has the OIDC service as issuer, and info related
to your artifact and how it was build in the subject key. And with it, the
signature is created.

The certificates issued by Fulcio have a really short validity because they are generated with a really close
expiration time. This is an interesting property that we will discuss shortly.

Once the artifact is signed, the proof of signature is then send to an
append-only transparency log ([Rekor](https://github.com/sigstore/rekor)) that
allows monitoring of such signatures and protects against timing attacks.
The proof of signature is signed by Rekor, and this information is stored inside of the signature itself.

By using the timestamp found inside of the proof of signature, the verifier can ensure
the signature has been done during the limited lifetime of the certificate.

Because of that, the private key associated with the certificate doesn't need to be
safely stored. It can be discarded at the end of the signature process.
An attacker could even reuse the private key, but the signatures would not be considered
valid if they are done outside of the limited lifetime of the certificate.

Nobody (neither developers, project leads, sponsors...) needs to have access to
keys (hence "keyless") and Sigstore never obtains your private key. And one
doesn't need an expensive infra for creating and validating signatures.

Since there's no need for key secrets and the like in Keyless mode, it is easily
automated inside CIs and implemented and monitored in the open. Hence why it is
so interesting.

### Building a Rust Sigstore stack

The part of the Kubewarden stack that instantiates and runs policies (the
[policy server](https://github.com/kubewarden/policy-server) and libs) is
written in Rust. This meant we needed a good Rust implementation of Sigstore
features, and one didn't exist. We are glad to say we have created a new crate,
[sigstore-rs](https://github.com/sigstore/sigstore-rs), under the Sigstore org
in an upstream-first manner, and it is taking a life of its own.

## Securing kubewarden policies

As you may already know, Kubewarden Policies are just small wasm-compiled
binaries (~1 to ~6MBs) that are distributed via container registries as OCI artifacts. Let see how
Kubewarden protects policies against Secure Supply Chain attacks by signing and
verifying them before they run.

### Signing your Kubewarden Policy

Signing a Policy, or what is the same, a container image, means just adding a
new layer with the signature. In the Sigstore workflow, one can sign with
Public-Private keypair, or Keyless. Both can also add `key=value` annotations to
the signatures.

The Public-Private key pair signing is straightforward, using [sigstore/cosign](https://github.com/SigStore/cosign):

```console
$ COSIGN_PASSWORD=yourpass cosign generate-key-pair

Private key written to cosign.key
Public key written to cosign.pub

$ COSIGN_PASSWORD=yourpass cosign sign \
  --key cosign.key --annotations blog=yes \
  ghcr.io/kubewarden/policies/user-group-psp:v0.2.0

Pushing signature to: ghcr.io/kubewarden/policies/user-group-psp
```

The Keyless mode is more interesting:
```console
$ COSIGN_EXPERIMENTAL=1 cosign sign \
  --annotations blog=yes \
  ghcr.io/kubewarden/policies/user-group-psp:v0.2.0

Generating ephemeral keys...
Retrieving signed certificate...
Your browser will now be opened to:
https://oauth2.sigstore.dev/auth/auth?access_type=online&client_id=sigstore&code_challenge=(...)
Successfully verified SCT...
tlog entry created with index: (...)
Pushing signature to: ghcr.io/viccuad/policies/volumes-psp
```

What happened? `cosign` prompted us for an OpenID Connect provider on the
browser, which authenticated us, and allowed Fulcio to sign our ephemeral keys.

If this were to happen in a CI, the CI can provide an OIDC identity token in
their environment. `cosign` has support for detecting some automated
environments and producing an identity token. Currently that covers
[Github And Google Cloud, but one can always use a flag](https://github.com/sigstore/cosign/blob/main/KEYLESS.md#identity-tokens).

This is how it works for policies built by the Kubewarden team in GH Actions:
we [call cosign](https://github.com/kubewarden/github-actions/blob/520eaa5e479fcb253ba09009c63f7fcfca1f743d/policy-release/action.yaml#L43),
and the resulting signature will be signed by a cert. This cert has:
- An `issuer`,  telling you who certifies the image:
  `https://token.actions.githubusercontent.com`
- A `subject` related to the specific workflow and worker, for example:
  `https://github.com/kubewarden/policy-secure-pod-images/.github/workflows/release.yml@refs/heads/main`

The end result is the same, a signature added, as a new image layer. You can see those signatures as added
[layers](https://github.com/kubewarden/user-group-psp-policy/pkgs/container/policies%2Fuser-group-psp/15759776?tag=v0.2.0),
with [`sha256-<sha>.sig` in the
repo](https://github.com/kubewarden/user-group-psp-policy/pkgs/container/policies%2Fuser-group-psp/versions).
Or better, either using `kwctl pull <policy_url>; kwctl inspect <policy_url>` or
with tools like [`crane`](https://github.com/google/go-containerregistry/blob/main/cmd/crane/doc/crane.md).

If you want to verify policies locally, you now can use `kwctl verify`:
```console
$ kwctl verify --github-owner kubewarden registry://ghcr.io/kubewarden/policies/pod-privileged:v0.1.10
$ echo $?
0
```

And when testing policies locally with `kwctl pull` or `kwctl run`, you can also
enable signature verification by using any verification related flag. For example:
```console
$ kwctl pull --github-owner kubewarden registry://ghcr.io/kubewarden/policies/pod-privileged:v0.1.10
$ echo $?
0
```


All the policies from the Kubewarden team are signed in keyless mode by the
workers of the CI job. In our case, the workers used in the CI job of Github.
We don't leave certs around, and they are verifiable by third parties.

### Enforcing signature verification for instantiated Kubewarden policies

You can now configure
[PolicyServers](https://doc.crds.dev/github.com/kubewarden/kubewarden-controller/policies.kubewarden.io/PolicyServer/v1alpha2)
to enforce that all policies being run will need to be signed. And when
deploying Kubewarden via Helm charts, you can do it so for the default
PolicyServer installed by `kubewarden-defaults` chart.

For this, the PolicyServers have a new [`spec.VerificationConfig`](https://doc.crds.dev/github.com/kubewarden/kubewarden-controller/policies.kubewarden.io/PolicyServer/v1alpha2#spec-verificationConfig) argument.
Here, you can put the name of a ConfigMap containing a "verification config", to
specify the needed signatures.

You can obtain a default verification config for policies from the Kubewarden
team with:

```yaml
$ kwctl scaffold verification-config
# Default Kubewarden verification config
#
# With this config, the only valid policies are those signed by Kubewarden
# infrastructure.
#
# This config can be saved to its default location (for this OS) with:
#   kwctl scaffold verification-config > /home/youruser/.config/kubewarden/verification-config.yml
#
# Providing a config in the default location enables Sigstore verification.
# See https://docs.kubewarden.io for more Sigstore verification options.
---
apiVersion: v1
allOf:
  - kind: githubAction
    owner: kubewarden
    repo: ~
    annotations: ~
anyOf: ~
```

The verification config format has several niceties, [see its reference docs](TODO point to VerificationConfig reference in docs).
For example, `kind: githubAction` with `owner` and `repo`, instead of checking the `issuer` and
`subject` strings blindly. Or `anyOf` a list of signatures, with `anyOf.atLeast` a number
of them: this allows for accepting at least a specific number of signatures, and
makes migration between signatures in your cluster easy. It's the little things 🤓.

If you want support for other CIs (such as Gitlab, Jenkins, etc) drop us some
words!

Once you have crafted your verification config, create your ConfigMap:
```console
$ kubectl create configmap my-verification-config \
  --from-file=verification-config=./my-verification-config.yml \
  --namespace=kubewarden
```

And pass it to your PolicyServers in `spec.VerificationConfig`, or if using the
default PolicyServer from the `kubewarden-defaults` chart, set it there with for example:
```console
$ helm upgrade --set policyServer.verificationConfig=my-verification-config \
  --wait -n kubewarden kubewarden-defaults ./kubewarden-defaults
```

## Recap

Using `cosign sign` we can sign our authored policies. With `kwctl verify`, we
can verify them, and with  `kwctl inspect` (and other tools such as `crane
manifest`), we can inspect the signatures.
We can keep using `kwctl pull` and `kwctl run` to test policies locally as in
the past, plus now verify their signatures too. Once we are satisfied,
[we can deploy Kubewarden PolicyServers so they enforce those signatures](TODO link to doc page on verification). And if we want, the
same verification config format can be used for `kwctl` and the cluster stack.

This way we are sure that the policies come from their stated authors, and have
not been tampered with. Phew!

We the Kubewarden team are curious on how you approach this. What workflows are you interested in?
What challenges do you have? Drop as word in our [Slack channel](https://kubernetes.slack.com/archives/C01T3GTC3L7)
or in a [Github issue](https://github.com/kubewarden)!

Still, there's more things to secure in the chain. Stay tunned for more blog
entries on how to secure your supply chain with Kubewarden!