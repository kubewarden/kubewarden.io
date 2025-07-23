---
title: "Kubewarden 1.27 Release"
authors:
  - José Guilherme Vanz
date: 2025-07-23
---

Here's a look at the key updates and improvements in the latest release.

## New High-Risk Service Account Policy

In this release, we've introduced a new policy to improve cluster security. The
**High-Risk Service Account Blocker** policy, as its name suggests, blocks
workloads that attempt to run with a service account that has excessive
permissions.

This policy allows cluster operators to define a list of forbidden permissions.
Workloads using a service account with any of these permissions will be
blocked. Check out the policy's
[repository](https://github.com/kubewarden/high-risk-service-account-policy) to
learn more about its configuration.

## New _kubernetes/can-i_ Host Capability

To make the High-Risk Service Account Blocker policy more efficient, this
release introduces a new host capability:
[`kubernetes/can_i`](https://docs.kubewarden.io/reference/spec/host-capabilities/kubernetes#operation---can_i).

This capability leverages the Kubernetes SubjectAccessReview API to check if a
service account has permission to perform certain operations. This approach
avoids the need to fetch numerous RBAC resources to determine if the service
account can perform the blocked operations, making the check much faster and
more reliable.

## _kwctl_ Now Mirrors _policy-server_ Behavior

The `kwctl` CLI now performs post-policy processing validations and changes
that were previously executed only by the `policy-server`. We've moved logic
for features like custom error messages and mutation permissions from the
`policy-server` codebase their common [evaluation
library](https://github.com/kubewarden/policy-evaluator).

As a result, users running policies with `kwctl` will now see the exact same
behavior that the `policy-server` would produce. This is great for testing
policy configurations before deploying them to a cluster.

## GSoC Update: JavaScript SDK Enhancements

This month also saw great enhancements to our JavaScript SDK. A big thank you
to **Esosa**, our GSoC mentee!

Esosa is focused on making the SDK stable and production-ready. He has
introduced a significant number of new host capabilities and improved the
codebase, paving the way for a public release. With that in mind, he is now
working on an alpha release of the SDK to validate the full release process and
test it with a template policy.

## Policy Fixes

We recently received a
[request](https://github.com/kubewarden/rego-policies-library/issues/50) from
the community to implement an additional validation in one of our Rego
policies. The **Kustomization Target Namespace** policy, which validates FluxCD
Kustomizations, now ensures that the optional `spec.targetNamespace` field is
set to one of the allowed namespaces. Prior to this change, requests were
accepted even if this field was not set.

## SBOM Generation Update and maintenance tasks

In this release, beyond the usual dependency updates and maintenance work,
we've removed all references to the deprecated
[spdx-sbom-generator](https://github.com/opensbom-generator/spdx-sbom-generator)
tool. All our GitHub Actions now use syft to generate SBOM files.

## Getting in touch

Join the conversation on
[Slack](https://kubernetes.slack.com/?redir=%2Fmessages%2Fkubewarden) or
[GitHub discussions](https://github.com/orgs/kubewarden/discussions) and let us
know how you’re using Kubewarden 1.27!
