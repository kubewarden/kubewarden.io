---
title: "Kubewarden 1.29 Release"
authors:
  - Víctor Cuadrado Juan
date: 2025-09-30
---

Straight from the kitchen, Kubewarden 1.29 is served! This release is a poké
bowl of healthy stack features, crisp policy improvements, and some fresh
fixes, all seasoned with the wholesome flavour of paid-off tech debt.

## Removal of Picky dependency and stringent behavior change

We have long depended on the Rust crate `picky` as the
implementation for X.509 and PKI certificates that we use in [our cryptographic host
capabilities](https://docs.kubewarden.io/reference/spec/host-capabilities/crypto).
It allowed us to overcome some limitations in the `webpki` crate.

These limitations have been resolved recently in the `rustls-wepbki` crate, a
fork of the original `webpki` project. For us, this meant that we could perform
the library migration as part of our recurring tech-debt efforts.

This library change from `picky` to `rustls-wepbki` for the cryptographic
host capability brings stricter behaviour when validating certificates:

- Key usage: Previously, certificates were checked only against signing usage.
  Now, we accept any key usage, which opens more use cases.
- Change with certificate chains: Now, a certificate will be considered
  untrusted if its intermediate CA is expired. Wepki does not check the
  expiration of the root CA.
- Field `not_after`: Previously, if omitted, the certificate expiration was not
  checked. Now, if a certificate chain is provided, we will always
  validate the certificate's entire validity period. It is no longer possible to
  validate a chain while ignoring the certificate's expiration date.
- With empty `cert_chain`: Previously, if no cert chain was provided, the
  certificate was assumed trusted. Now, we always validate the certificate, and
  if no chain is provided, the Mozilla's CA is used.

This host capability is exposed in our [cel
policy](https://artifacthub.io/packages/kubewarden/cel-policy/cel-policy), and
also in our [verify-image-signatures](https://artifacthub.io/packages/kubewarden/verify-image-signatures/verify-image-signatures)
policy (point 5 of the readme).

## Granular timeout protection for policies

Policies usually run and finish fast enough. Yet there can be some that perform
more complex validations: for example the
[`env-variable-secrets-scanner`](https://artifacthub.io/packages/kubewarden/env-variable-secrets-scanner/env-variable-secrets-scanner)
policy, which uses a Rust library to scan for secrets in environment variables.
For these policies, it is beneficial to extend the evaluation time alloted to
them.

Up until now, this was possible globally per PolicyServer by setting their env
var `KUBEWARDEN_POLICY_TIMEOUT` via its `spec.env`.

With 1.29.0, we have added a new field `spec.timeoutEvalSeconds` to all policy
resources. This allows to set the evaluation timeout on a per-policy basis,
in addition to per PolicyServer.

This field complements the already existing `spec.timeoutSeconds`, which sets
the timeout for the associated Kubernetes Webhook for the policy.

The new `spec.timeoutEvalSeconds` field is optional. After the timeout passes,
the policy evaluation call will fail as usual based on the `spec.failurePolicy`
setting. Its value must be between 2 and 30 seconds. The new field value is
checked so it doesn't exceed `spec.timeoutSeconds`, and so neither
`timeoutSeconds` nor `timeoutEvalSeconds` can be greater than the maximum
webhook timeout from Kubernetes (hardcoded at 30s).

In the case of AdmissionPolicies and ClusterAdmissionPolicies, this new field
is part of the [usual spec](https://docs.kubewarden.io/reference/CRDs#policyspec).

For AdmissionPolicyGroups and ClusterAdmissionPolicyGroups, the new field is
[part of each
member](https://docs.kubewarden.io/reference/CRDs#policygroupmember) instead of
the global policy group spec, which allows for more fine tuning.

## container-resources policy improvements

This policy enforces memory and CPU requests and limits. Since version
`v1.1.0`, it now supports `minRequest` validation for both CPU and memory:

```yaml
memory:
  defaultRequest: "100M"
  defaultLimit: "500M"
  minRequest: "50M" # new
  maxLimit: "4G"
cpu:
  defaultRequest: 100m
  defaultLimit: 200m
  minRequest: 50m # new
  maxLimit: 500m
```

As with the pre-existing values, the policy verifies that the `defaultRequest`
must be between `minRequest` and `maxLimit`, and that the `defaultLimit` must
be less than `maxLimit`.

## persistentvolumeclaim-storageclass policy improvements

This policy checks the use of StorageClasses with PersistentVolumeClaims.
Since version `v1.1.0`, it now supports an allow-list in the form of:

```yaml
# A list of storage classes that are permitted.
# Mutually exclusive with deniedStorageClasses.
allowedStorageClasses: # new
  - standard
  - slow
```

This new `allowedStorageClasses` setting cannot be used in conjunction with
`deniedStorageClasses` (you either have an allow-list, or a deny-list). One
can always deploy several policies, though.

## ContainerDays Hamburg 2025

One of our maintainers (Víctor, your narrator today!) had a speaker slot
on [ContainerDays 2025
Hamburg](https://www.containerdays.io/containerdays-conference-2025), with the
talk _"Simplifying cluster security with CEL"_. In it we gave an overview on
the CEL language, its uses in both Kubernetes Admission Controllers and Dynamic
Admission Controllers such as Kubewarden, and explained how we expanded on it
for Kubewarden.

Stay tuned to their [YouTube channel](https://www.youtube.com/@ContainerDays)
to watch the recording!

## Google Summer of Code wrapped up!

We are happy to congratulate Esosa Ohangbon, our Google Summer Of Code
mentee, on successfully completing the mentorship! 🎉🥳🎊

Esosa worked on fleshing out a new [Policy SDK for
Typescript/Javascript](https://www.npmjs.com/package/kubewarden-policy-sdk).
The end result is a tech-preview of a useful SDK. We look forward to
collaborations such as this one!

## Signing Hauler manifest

Since Kubewarden 1.28, we also ship a [Hauler
manifest](../08/kubewarden-1.28-release/) together with our Helm charts to
simplify air-gap installs.

With 1.29, we now cryptographically sign the Hauler manifest, the image and the
policies list.

For example, to verify with Cosign the `hauler_manifest.yaml`:

```console
$ cosign verify-blob --bundle hauler_manifest_cosign.bundle \
  --certificate-identity-regexp 'https://github.com/kubewarden/*' \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com \
  hauler_manifest.yaml
Verified OK
```

## Fixed Crypto host capability regression

On Kubewarden 1.28, we shipped a minor feature to allow performing session
replays of the [Crypto host capability](https://docs.kubewarden.io/reference/spec/host-capabilities/crypto).
This host capability is the one used in only one of the possible settings for
the verify-image-signatures policy: verifying via certificates ([point 5 in its
readme](https://github.com/kubewarden/verify-image-signatures)).

In doing so, we broke this specific host capability API, and therefore, this policy
setting too.

With 1.29, we have corrected this regression, and this specific policy
setting works as expected.

# Getting in touch

Join the conversation on
[Slack](https://kubernetes.slack.com/?redir=%2Fmessages%2Fkubewarden) or
[GitHub discussions](https://github.com/orgs/kubewarden/discussions) and let us
know how you’re finding Kubewarden 1.29!
