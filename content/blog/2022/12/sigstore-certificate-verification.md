---
title: Support for sigstore certificate signing
authors:
- Flavio Castelli
date: 2022-12-05
---

Secure supply chain is one of the hottest topics right now. Many organizations
are implementing strategies to verify the provenance of their software starting from
the development phase up to the deployment in production.

[Sigstore](https://sigstore.dev/) is an open source project that makes incredibly
easy to sign and verify assets. Lots of open source projects and organizations
are using it to sign and verify their container images, system packages and any kind
of binary artifact.
It's no secret we are Sigstore enthusiasts.

We are using Sigstore to sign and verify our whole
software stack, we are maintainers of the official [Rust SDK](https://github.com/sigstore/sigstore-rs),
we are [exposing its capabilities to policy authors](https://docs.kubewarden.io/writing-policies/spec/host-capabilities/signature-verifier-policies)
and, finally, we have been providing a
[Kubewarden policy](https://github.com/kubewarden/verify-image-signatures/) that
can be used to verify the container images allowed into a Kubernetes cluster.

Sigstore supports different signing mechanisms. Today we're happy to announce
that Kubewarden is now exposing all the primitives required to verify signatures
produced with user-defined certificates. At signature time, these certificates
can be read from the local file system or, more interestingly, could be used by
a hardware token (like a Yubikey) or by a KMS.

With this addition, Kubewarden can verify these the signatures produced in those
ways.

## Required versions

Certificate based verification is available starting from these releases:

* Kubewarden stack: version 1.4.0 or later
* [verify-image-signatures](https://artifacthub.io/packages/kubewarden/verify-image-signatures/verify-image-signatures)
policy: version 0.2.0 or later

## Certificate verification in action

Certificate based verification is now available to all our policy authors. However
there's no need to write any code, since we've extended our
[`verify-image-signatures` policy](https://github.com/kubewarden/verify-image-signatures/)
to support this new type of verification.

The following snippet shows how to ensure that all the container images coming
from `registry.example.org/project-safety` have been signed by both Alice and Bob:

```yaml
apiVersion: policies.kubewarden.io/v1
kind: ClusterAdmissionPolicy
metadata:
  name: verify-image-signatures
spec:
  module: ghcr.io/kubewarden/policies/verify-image-signatures:v0.1.7
  rules:
  - apiGroups: ["", "apps", "batch"]
    apiVersions: ["v1"]
    resources: ["pods", "deployments", "statefulsets", "replicationcontrollers", "jobs", "cronjobs"]
    operations:
    - CREATE
    - UPDATE
  mutating: true
  settings:
    signatures:
    - image: "registry.example.org/project-safety/*"
      certificate:
      - |
        -----BEGIN CERTIFICATE-----
        Alice's cert
        -----END CERTIFICATE-----
      - |
        -----BEGIN CERTIFICATE-----
        Bob's cert
        -----END CERTIFICATE-----
      certificateChain:
      - |
        -----BEGIN CERTIFICATE-----
        <intermediate cert>
        -----END CERTIFICATE-----
      - |
        -----BEGIN CERTIFICATE-----
        <root CA>
        -----END CERTIFICATE-----
      requireRekorBundle: true
```

This will make sure that images like `registry.example.org/project-safety/micro-svc-shopping-cart:v1.0.0`
and `registry.example.org/project-safety/micro-svc-search:v1.2.0` are signed
by Alice and Bob.

## Breaking changes to the "`verify-image-signature`" policy

Starting from version TODO of the "`verify-image-signature`", all the policy settings
are going to use the [`camelCase`](https://en.wikipedia.org/wiki/Camel_case)
naming convention.

This means the following configuration keys changed their ID:

* Keyless verification produced by GitHub: `github_actions` &rarr; `githubActions`
* Keyless verification using a subject prefix:
  * `url_prefix` &rarr; `urlPrefix`
  * `keyless_prefix` &rarr; `keylessPrefix`

## Call for action

That's all for today, it's time to give these changes a try!

Feel free to [reach out to us](https://kubernetes.slack.com/?redir=%2Fmessages%2Fkubewarden)
if you have any questions or want to share your feedback!
