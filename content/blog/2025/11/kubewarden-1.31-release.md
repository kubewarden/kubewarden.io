---
title: "Kubewarden 1.31 Release"
authors:
  - Víctor Cuadrado Juan
date: 2025-11-25
---

Preparing for season celebrations, Kubewarden grabbed its running shoes and
went for a lively jog. This release is about keeping your cluster
environment fit and lively: new policy, new Sigstore airgap features, backup
support, and new resource limits for our Helm charts and among other things.

The running group is growing too!

## New peer project: SBOMScanner

As announced some weeks ago, the Kubewarden family is growing with the addition
of SBOMscanner. Have a read of its [blog post here](https://www.kubewarden.io/blog/2025/11/expanding-kubewarden-scope/).

Join us on our next [community monthly
meeting](https://teamup.com/event/show/id/nyWa5xgAuYk9jTYM6D4LcQbSQrJ3Fq) on
Thursday 11th of December to learn more and ask any questions you may have!

## New probes policy

The Kubewarden team is now maintaining a new policy, the `probes` policy. This
policy checks the livenessProbe and readinessProbe of containers. You can find
it, as always, on [artifacthub.io](https://artifacthub.io/packages/kubewarden/probes-policy/probes-policy).

This policy was started in the community by Nicolas Mirault (nlamirault),
who we thank. We felt the policy was a good candidate for being supported
by the Kubewarden team and published in ArtifactHub, so we have elected to
[fork](https://github.com/kubewarden/probes-policy), release, and maintain our
own policy based on it.

We think this showcases the usefulness of our modular architecture, as one can
work on policies as their own deliverables instead of them being part of a big
kubernetes controller codebase.

The policy enforces the presence of liveness and readiness probes as such:

```yaml
settings:
  liveness:
    enforce: true
  readiness:
    enforce: true
```

Not only that, but for both liveness and readines probes, one can set
optional thresholds, timeouts and grace periods. For example as we do here for
the readiness probe:

```yaml
settings:
  readiness:
    enforce: true
    failureThreshold: # optional
      minimum: 1
      limit: 5
    initialDelaySeconds: # optional
      minimum: 2
      limit: 3
    periodSeconds: # optional
      minimum: 1
      limit: 10
    successThreshold: # optional
      minimum: 3
      limit: 12
    terminationGracePeriodSeconds: # optional
      minimum: 1
      limit: 3
    timeoutSeconds: # optional
      minimum: 1
      limit: 10
```

We thank again the original author, nlamirault, and we look forward
to more policy ideas from the community!

## kwctl accepts the new Sigstore ClientTrustConfig format (BYO-PKI)

For the previous 1.30 release [we
talked](https://www.kubewarden.io/blog/2025/10/kubewarden-1.30-release/) about how
we are performing a migration to Cosign v3. Sigstore tools are moving away from
consuming several config files containing certificates and endpoints, and towards
consuming a single JSON configuration file with all the certificates, URLs and
information to perform signing and verifications. It's colloquially named
"Bring Your Own PKI (BYO-PKI)". This makes things simpler for clients such as
kwctl and users in an air-gap environment.

For kwctl, we dropped from the previous 1.30 release the optional
`--fulcio-cert-path` and `--rekor-public-key-path` flags used to support custom
Sigstore trusted roots or air-gapped environments.

In this release, we are adding a new `--trust-config` flag which specifies a
path to this JSON file containing a
[ClientTrustRoot](https://github.com/sigstore/protobuf-specs/blob/4d38e4482bf67c7ab86bf2f61e8d79010ac0974e/protos/sigstore_trustroot.proto#L341)
object.

This new `--trust-config` flag is also optional; if not specified, kwctl will
continue using the default upstream Sigstore services such as Rekor and Fulcio.

Users that want to use kwctl against their own custom Rekor and Fulcio services,
(like those inside an air-gap) can now pass the JSON config
file via this new flag.

As usual, we have created new testcases for this feature. In this case, we
check kwctl behavior against a custom Sigstore stack. For this, we are
leveraging the
[`sigstore/scaffolding`](https://github.com/sigstore/scaffolding) project.

### Example

Let's see an abridged example from our colleage José Vanz. José
has first deployed his own Sigstore stack with `sigstore/scaffolding`.

With it, he has then signed and verified a Kubewarden policy. This means
he used his local Fulcio to provide the ephemeral Sigstore signing certificate,
and his local Rekor to store the signature proof in the append-only log:

```console
$ cosign sign \
  --rekor-url $REKOR_URL \
  --fulcio-url $FULCIO_URL \
  --yes \
  --allow-insecure-registry ghcr.io/jvanz/policies/testing-sigstore-localinfra:latest  \
  --identity-token $(curl -s $ISSUER_URL)

$ cosign verify \
  --rekor-url $REKOR_URL \
  --allow-insecure-registry ghcr.io/jvanz/policies/testing-sigstore-localinfra:latest \
  --certificate-identity=https://kubernetes.io/namespaces/default/serviceaccounts/default \
  --certificate-oidc-issuer=https://kubernetes.default.svc.cluster.local
```

Now, we can verify these signatures with kwctl. The kwctl verification config
should contain a matching issuer:

```console
$ cat ./verification-config.yaml
apiVersion: v1
allOf:
- kind: genericIssuer
  issuer: https://kubernetes.default.svc.cluster.local # local issuer
  subject:
    equal: https://kubernetes.io/namespaces/default/serviceaccounts/default
anyOf: null
```

And now, we can create the new trusted root config, and pass it to
kwctl using the new `--trust-config` flag:

```console
$ cosign trusted-root create \
    --fulcio="url=$FULCIO_URL,certificate-chain=/home/jvanz/SUSE/scaffolding/fulcio.pem" \
    --rekor="url=$REKOR_URL,public-key=/home/jvanz/SUSE/scaffolding/rekor.pub,start-time=2024-01-01T00:00:00Z" \
	--tsa="url=$TSA_MIRROR,certificate-chain=/home/jvanz/SUSE/scaffolding/tsa.pem" \
	--ctfe="url=$CTLOG_MIRROR,public-key=/home/jvanz/SUSE/scaffolding/ctfe.pub,start-time=2024-01-01T00:00:00Z" \
  # this creates ./trust_config.json

$ kwctl verify \
 --trust-config ./trust_config.json \
 --verification-config-path ./verification-config.yaml \
 registry://ghcr.io/jvanz/policies/testing-sigstore-localinfra:latest
2025-11-10T19:23:35.965221Z INFO kwctl::verify: Policy successfully verified
```

Success!

This showcases a great path for using Kubewarden + Sigstore in air-gap
scenarios or with custom Sigstore stacks. Stay tuned!

## Support on rancher-backup Operator

Starting with `v9.0.0`, the
[`rancher-backup`](https://github.com/rancher/backup-restore-operator) Operator
supports Kubewarden. This operator is an open source project to backup and restore
Kubernetes clusters. We have contributed the neccesary bits to the
`rancher-backup` Operator, and we have also added testcases in our end-to-end
testsuite to ensure that backing up and restoring keeps being suppported with
each Kubewarden release.

You can read how to backup and restore Kubewarden with this operator in our
kubewarden docs
[here](https://docs.kubewarden.io/howtos/rancher-backup-operator).

## kubewarden-controller chart gains resource limits & requests for post-install and pre-delete hooks

Since long, the `kubewarden-controller` chart has resource limits and requests
for all the resources deployed by the Helm chart.

With this release, we are adding these limits and requests to the Helm
post-install and pre-delete hooks. This for example simplifies install,
upgrade, and uninstall if you are enforcing limits and requests on your
cluster.

You can find them under `.Values.resources.preDeleteJob` and
`.Values.resources.PostInstallJob` and set to very conservative values, as the
jobs are small.

# Getting in touch

Join the conversation on
[Slack](https://kubernetes.slack.com/?redir=%2Fmessages%2Fkubewarden) or
[GitHub discussions](https://github.com/orgs/kubewarden/discussions) and let us
know how you’re finding Kubewarden 1.31!
