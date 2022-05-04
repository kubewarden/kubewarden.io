---
title: "Secure Supply Chain with Kubewarden: securing Kubewarden policies"
authors:
- Víctor Cuadrado Juan
date: 2022-05-02
---

With recent releases, the Kubewarden stack supports 
verifying the integrity and authenticity of content using the
[Sigstore project](https://www.sigstore.dev/).

In this post, we focus on Kubewarden Policies and how to create a Secure Supply
Chain for them.

## Sigstore?

Since a full Sigstore dive is not for this post, we recommend checking out [their nice docs](https://docs.sigstore.dev).

In short, Sigstore provides an automatable workflow to match the
distributed Open Source development model. The workflow specifies how to
digitally sign and verify artifacts which in our case are Kubewarden Policies. 
It also provides a transparency log to monitor such signatures. The workflow allows to sign
artifacts with traditional Public-Private key pairs, or in Keyless mode.

In the keyless mode, signatures are created with short-lived certs
using an OpenID Connect (OIDC) service as identity provider. Those short-lived certs are
issued by Sigstore's PKI infrastructure, [Fulcio](https://github.com/sigstore/fulcio).

Fulcio acts as a Registration Authority, authenticating that you are who you say
you are by using an OIDC service (SSO via your own Okta instance, GitHub,
Google, etc). Once authenticated, Fulcio acts as a Certificate Authority, issuing the
short-lived certificate that you will use to sign artifacts.

These short-lived certificate include the identity information obtained by the
OIDC service inside of the certificate extensions attributes. The private key
associated with the certificate is then used to sign the object while the
certificate itself has a public key that can be used to verify the signatures
produced by the private key.

The certificates issued by Fulcio have a short validity because they are generated
to be short-lived. This is an interesting property that we will discuss shortly.

Once the artifact is signed, the proof of signature is then sent to an
append-only transparency log, [Rekor](https://github.com/sigstore/rekor), that
allows monitoring of such signatures and protects against timing attacks.
The proof of signature is signed by Rekor and this information is stored 
inside of the signature itself.

By using the timestamp found inside of the proof of signature, the verifier can 
ensure that the signing action has been performed during the limited lifetime of 
the certificate.

Due to this the private key associated with the certificate doesn't need to be
safely stored. It can be discarded at the end of the signature process.
An attacker could even reuse the private key, but the signature would not be 
considered valid if used outside of the limited lifetime of the certificate.

Nobody - developers, project leads, or sponsors, needs to have access to
keys and Sigstore never obtains your private key. Hence the term keyless. 
Additionaly, one doesn't need expensive infra for creating and validating 
signatures.

Since there's no need for key secrets and the like in Keyless mode, it is easily
automated inside CIs and implemented and monitored in the open. This is one of the
reasons that makes it so interesting.

### Building a Rust Sigstore stack

The [policy server](https://github.com/kubewarden/policy-server) and libs within the
Kubewarden stack are responsible for instantiating and running policies. They are
written in Rust and therefore, we needed a good Rust implementation of Sigstore
features. Since there weren't any available, we are glad to announce that we have
created a new crate, [sigstore-rs](https://github.com/sigstore/sigstore-rs), under the 
Sigstore org. This was done in an upstream-first manner and we're happy to report that
it is now taking a life of its own.

## Securing kubewarden policies

As you may already know, Kubewarden Policies are small wasm-compiled
binaries (~1 to ~6 MB) that are distributed via container registries as OCI artifacts. 
Let us see how Kubewarden protects policies against Secure Supply Chain attacks by 
signing and verifying them before they run.

### Signing your Kubewarden Policy

Signing a Policy is done in the same way as signing a container image. This means just adding a
new layer within the signature to a dedicated signature object managed by Sigstore.
In the Sigstore workflow, one can sign with Public-Private keypair, or Keyless. 
Both can also add `key=value` annotations to the signatures.

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
browser, which authenticated us, and instructed Fulcio to generate an ephemeral 
private key and a x509 certificate with the associated public key.

If this were to happen in a CI, the CI would provide the OIDC identity token in
its environment. `cosign` has support for detecting some automated
environments and producing an identity token. Currently that covers
[GitHub And Google Cloud, but one can always use a flag](https://github.com/sigstore/cosign/blob/main/KEYLESS.md#identity-tokens).

We shall now detail how it works for policies built by the Kubewarden team in GitHub Actions.
First, we [call cosign](https://github.com/kubewarden/github-actions/blob/520eaa5e479fcb253ba09009c63f7fcfca1f743d/policy-release/action.yaml#L43), and sign the policy in keyless mode. The certificate issued by Fulcio includes the following details
about the identity of the signer inside of its x503v extensions:

- An `issuer`,  telling you who certified the image:
  ```
  https://token.actions.githubusercontent.com
  ```
- A `subject` related to the specific workflow and worker, for example:
  ```
  https://github.com/kubewarden/policy-secure-pod-images/.github/workflows/release.yml@refs/heads/main
  ```

If you are curious, and want to see the contents of one of the certificates issued by Fulcio, install
the [`crane`](https://github.com/google/go-containerregistry/tree/main/cmd/crane) cli tool, `jq` and
`openssl` and execute the following command:

```console
crane manifest \
  $(cosign triangulate ghcr.io/kubewarden/policies/pod-privileged:v0.1.10) | \
  jq -r '.layers[0].annotations."dev.sigstore.cosign/certificate"' | \
  openssl x509 -noout -text -in -
```

The end result is the same.  A signature is added as a new image layer of a special OCI object
that is created and managed by Sigstore. You can view those signatures as added
[layers](https://github.com/kubewarden/user-group-psp-policy/pkgs/container/policies%2Fuser-group-psp/15759776?tag=v0.2.0),with [`sha256-<sha>.sig` in the repo](https://github.com/kubewarden/user-group-psp-policy/pkgs/container/policies%2Fuser-group-psp/versions).

Even better, you can use tools like [`crane`](https://github.com/google/go-containerregistry/blob/main/cmd/crane/doc/crane.md) or the CLI tool, kwctl to
perform the same action as demonstrated below.

```
kwctl pull <policy_url>; kwctl inspect <policy_url>
```

If you want to verify policies locally, you now can use `kwctl verify`:
```console
$ kwctl verify --github-owner kubewarden registry://ghcr.io/kubewarden/policies/pod-privileged:v0.1.10
$ echo $?
0
```

When testing policies locally with `kwctl pull` or `kwctl run`, you can also
enable signature verification by using any verification related flag. For example:
```console
$ kwctl pull --github-owner kubewarden registry://ghcr.io/kubewarden/policies/pod-privileged:v0.1.10
$ echo $?
0
```


All the policies from the Kubewarden team are signed in keyless mode by the
workers of the CI job, specifically the CI job of Github.
We don't leave certs around and they are verifiable by third parties.

### Enforcing signature verification for instantiated Kubewarden policies

You can now configure
[PolicyServers](https://doc.crds.dev/github.com/kubewarden/kubewarden-controller/policies.kubewarden.io/PolicyServer/v1alpha2)
to enforce that all policies being run need to be signed. When
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

The verification config format has several niceties, [see its reference docs](https://docs.kubewarden.io/distributing-policies/secure-supply-chain.html).
For example, `kind: githubAction` with `owner` and `repo`, instead of checking the `issuer` and
`subject` strings blindly. Or `anyOf` a list of signatures, with `anyOf.atLeast` a number
of them: this allows for accepting at least a specific number of signatures, and
makes migration between signatures in your cluster easy. It's the little things 🤓.

If you want support for other CIs (such as GitLab, Jenkins, etc) drop us a
note on Slack or file a GitHub issue!

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

Using `cosign sign` policy authors can sign or author their policies. All the policies owned by the Kubewarden
team have already been signed in this way.

With `kwctl verify`, operators
can verify them, and with `kwctl inspect` (and other tools such as `crane
manifest`), operators can inspect the signatures.
We can keep using `kwctl pull` and `kwctl run` to test policies locally as in
the past, plus now verify their signatures too. Once we are satisfied,
[we can deploy Kubewarden PolicyServers so they enforce those signatures](https://docs.kubewarden.io/distributing-policies/secure-supply-chain.html). If we want, the
same verification config format can be used for `kwctl` and the cluster stack.

This way we are sure that the policies come from their stated authors, and have
not been tampered with. Phew!

We, the Kubewarden team, are curious on how you approach this. What workflows are you interested in?
What challenges do you have? Drop us a word in our [Slack channel](https://kubernetes.slack.com/archives/C01T3GTC3L7)
or foile a [GitHub issue](https://github.com/kubewarden)!

There are more things to secure in the chain and we're excited for what lays ahead.
Stay tuned for more blog entries on how to secure your supply chain with Kubewarden!
