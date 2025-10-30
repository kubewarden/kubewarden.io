---
title: "Kubewarden 1.30 Release"
authors:
  - Víctor Cuadrado Juan
  - Flavio Castelli
date: 2025-10-30
---

Today, Kubewarden 1.30 woke up, shook itself, stretched its wings and took off
to a cluster near you! This release brings in its beak a bunch of policy
features, and performs some future-proofing migrations.

## Migration to OpenReports

So far, the Kubewarden Audit Scanner feature has been using the PolicyReports CRDs
from `policyreports.wgpolicyk8s.io` to save its results. These CRDs came from
the [Kubernetes Policy Working
Group](https://github.com/kubernetes/community/blob/master/wg-policy/README.md)
and enabled standardized reporting across policy engines.

This initiative has grown into [OpenReports](https://openreports.io), of
which Kubewarden is a proud part.

{{< figure class="center" src="/images/openreports.png" alt="OpenReports logo">}}

The OpenReports project is a collaborative effort between multiple CNCF projects
and ecosystem companies. You can find the project on
[GitHub](https://github.com/openreports) and on the [#openreports
channel](https://cloud-native.slack.com/archives/C08JH5223A6) in the CNCF Slack
workspace.

Starting with `v1.30`, the Audit Scanner retains a default configuration to
save results in the deprecated PolicyReports CRDs from
`policyreports.wgpolicyk8s.io`, but supports the new OpenReports.
This is configurable in the `kubewarden-controller` Helm chart via the value
`auditScanner.reportCRDsKind`, which defaults to `policyreport`, but can be set
to `openreports`.

In addition, the `kubewarden-crds` Helm chart installs the deprecated
PolicyReports CRDs by default, and in addition also installs the new
OpenReports CRDs. This is configurable via its values `installPolicyReportCRDs`
and `installOpenReportsCRDs`.

> **Note**
> We will announce the complete deprecation of the old PolicyReports CRDs and
> move into OpenReports CRDs in a future release. For now, no change is needed.

For more information on OpenReports, read our refreshed docs, like the
[explanation of policy reports](https://docs.kubewarden.io/explanations/audit-scanner/policy-reports),
the [how-to on audit scanner](https://docs.kubewarden.io/howtos/audit-scanner),
and the [dependency matrix reference](https://docs.kubewarden.io/reference/dependency-matrix) page.

## Migration to Cosign v3: changes in signing attestations and SBOMs

Released this October, [Cosign v3 ](https://blog.sigstore.dev/cosign-3-0-available/) is a major
update for Sigstore's CLI tool for artifact signing and verification.

Cosign `v2.6.X` added opt-in support for:

- New bundled formats of signed material and offline verification data
- Managing verification keys with rotation support without updating the client
- Using a signing config for rotation transparency log shards without client updates

Cosign `v3` switches these capabilities by default while still allowing them to be disabled.
This means changes in the resulting created artifacts. For Kubewarden:

- OCI artifacts (container images, policies, Helm charts, SBOM & provenance
  layers): We have elected to sign them both in Cosign v2-style and Cosign v3 so
  our users can perform a smooth migration for OCI artifacts, as specific
  in-cluster tools are sometimes needed for these.
- SBOMs, provenance and other artifacts GH releases: Given that these are verified
  with Cosign, we expect our users to use Cosign v3. Because of that, all these artifacts are being signed only using
  the v3 style.
- Our signature verification policies, such as the
  [verify-image-signatures](https://artifacthub.io/packages/kubewarden/verify-image-signatures/verify-image-signatures)
  policy and those [CEL policies using Sigstore
  verification](https://docs.kubewarden.io/tutorials/writing-policies/CEL/example-sigstore#example-sigstore-verification-policy),
  will, for now, only validate Cosign v2 signatures. A follow-up update will
  add Cosign v3 support.

Our OCI artifacts continue to be verifiable with
[Hauler](https://hauler.dev/) (for our Helm chart releases),
[slsactl](https://github.com/rancherlabs/slsactl) or Cosign. Have a
look at our
[tutorial](https://docs.kubewarden.io/tutorials/verifying-kubewarden) for
verifying Kubewarden.

### Changes to kwctl flags

Starting with this release, the `fulcio-cert-path` and `rekor-public-key-path` flags are removed from kwctl. These flags were related to Sigstore and used to support custom Sigstore instances or air-gapped environments.

This breaking change was prompted by two developments in the Sigstore project.

First, Rekor—the transparency log of Sigstore—recently added a new public key. When verifying a signature bundle produced by Rekor, the correct key must be used, identified by a specific ID. The old kwctl flags did not provide a way to specify this ID. While we could have added this value to the existing `rekor-public-key-path`, it would still have resulted in a breaking change.

Previously, all certificates and keys for the public Sigstore instance were available as individual files in Sigstore's TUF repository. The public TUF repository could be easily obtained by running `cosign initialize` and checking the contents of `~/.sigstore/root`.

However, in recent months, the contents of the TUF repository have changed. These files are no longer delivered as individual entities, but are now embedded inside a JSON document containing a [`TrustedRoot`](https://github.com/sigstore/protobuf-specs/blob/15d9c3dc04cfc6cd1fb5f4258e79ff430ec73e0f/protos/sigstore_trustroot.proto#L155) object. This change makes it harder to obtain the files required by the kwctl flags we just removed.

We plan to introduce new flags that will obtain all necessary Sigstore certificates and files by parsing the contents of a [`TrustedRoot`](https://github.com/sigstore/protobuf-specs/blob/15d9c3dc04cfc6cd1fb5f4258e79ff430ec73e0f/protos/sigstore_trustroot.proto#L155) or a [`ClientTrustRoot`](https://github.com/sigstore/protobuf-specs/blob/4d38e4482bf67c7ab86bf2f61e8d79010ac0974e/protos/sigstore_trustroot.proto#L341) object.

## CEL policy gains params support

With [cel-policy](https://artifacthub.io/packages/kubewarden/cel-policy/cel-policy)
`v1.4.0`, the policy has gained the ability to [read parameters from other
resources](https://artifacthub.io/packages/kubewarden/cel-policy/cel-policy#parameters)
to separate validation logic from its values, much like Kubernetes'
ValidatingAdmissionPolicies do.

This means that the policy now has 2 new fields in its settings: `paramKind`
which defines the resource type to use as parameter, and `paramRef` which
defines how to find the resource. This includes supporting
`paramRef.parameterNotFoundAction` and `spec.failurePolicy` as well.

Contrary to VAPs, there's no need to have a ValidatingAdmissionPolicyBinding as
everything is contained in the same Kubewarden AdmissionPolicy, which we think
simplifies the UX. Also, you can benefit from Kubewarden-only features, such as
the fine-grained per-policy permissions for accessing cluster resources with
the policy `spec.contextAwareResources`, or the rest of the Kubewarden goodies,
such as PolicyGroups and namespaced segregation, tracing and monitoring, Audit
Scanner, etc.

Of course, enhancing the policy means we took care of the rest of Kubewarden's stack.
We have expanded support on performing migrations from VAPs into Kubewarden's
CEL policy with `kwctl scaffold vap`, which now supports params.

The tutorial on [reusing VAPs into our CEL
policy](https://docs.kubewarden.io/next/tutorials/writing-policies/CEL/reusing-vap)
has also been refreshed, have a look!

## PriorityClass policy gains mutation & denylist

With `v1.1.1`, the [PriorityClass
policy](https://artifacthub.io/packages/kubewarden/priority-class-policy/priority-class-policy)
now supports [a
denylist](https://artifacthub.io/packages/kubewarden/priority-class-policy/priority-class-policy#deny-list).
In addition to the existing `settings.allowed_priority_classes`, you can now
use `settings.denied_priority_classes`.

The policy now can be a mutating policy with the addition of
`settings.default_priority_class`, which if set, will give value to the
`priorityClassName` of the workload resource if this one was empty. Note that if
used together with the allow list or deny list, the default must pass the
validation of these lists.

# Getting in touch

Join the conversation on
[Slack](https://kubernetes.slack.com/?redir=%2Fmessages%2Fkubewarden) or
[GitHub discussions](https://github.com/orgs/kubewarden/discussions) and let us
know how you’re finding Kubewarden 1.30!
