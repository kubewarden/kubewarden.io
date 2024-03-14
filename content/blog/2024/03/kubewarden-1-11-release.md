---
title: Kubewarden 1.11 release
authors:
  - Flavio Castelli
date: 2024-03-21
---

Today we're glad to announce the release of Kubewarden 1.11.

This release focuses on performance improvements, especially when running on big Kubernetes clusters.

## Audit Scanner

A lot of work has been done on the audit scanner. The auditing of resources is now done in parallel, which means less time is required on big clusters to scan all the available resources.

We've also changed how we handle Policy Reports. Kubewarden is still using the Policy Report format being defined inside the Kubernetes's `wg-policy` group. However, prior to this release,
we used to create one `PolicyReport` per `Namespace` and one `ClusterPolicyReport` per cluster.
This solution proved to not scale inside clusters with many audited resources. Depending on the number of policies and audited resources, the size of the final report objects could be too big to fit into etcd.
Moreover, the amount of memory required by the audit scanner could be significant.

That's why, starting from Kubewarden 1.11, the audit scanner creates one `PolicyReport` per namespaced resource and one `ClusterPolicyReport` per cluster-wide resource being scanned.
That ensures the reports can always fit etcd's size requirement. On top of that, now the audit scanner process always consumes the same amount of memory, regardless of the number of
policies and resources being audited.

Getting the auditing results of the resources defined inside a namespace can be done in this way:

```console
kubectl get polr -o wide

NAME                                   KIND         NAME                        PASS   FAIL   WARN   ERROR   SKIP   AGE
009805e4-6e16-4b70-80c9-cb33b6734c82   Deployment   deployment1                 5      1      0      0       0      1h
011e8ca7-40d5-4e76-8c89-6f820e24f895   Deployment   deployment2                 2      4      0      0       0      1h
02c28ab7-e332-47a2-9cc2-fe0fad5cd9ad   Pod          pod1                        10     0      0      0       0      1h
04937b2b-e68b-47d5-909d-d0ae75527f07   Pod          pod2                        9      1      0      0       0      1h
...

```

While the auditing results of cluster-wide resources can be obtained in this way:

```console
kubectl get cpolr -o wide

NAME                                   KIND        NAME                 PASS   FAIL   WARN   ERROR   SKIP   AGE
261c9492-deec-4a09-8aa9-cd464bb4b8d1   Namespace   namespace1           3      1     0       0       0      1h
35ca342f-685b-4162-a342-8d7a52a61749   Namespace   namespace2           0      4     0       0       0      1h
3a8f8a88-338b-4905-b9e4-f13397a0d7b5   Namespace   namespace3           4      0     0       0       0      15h
```

Take a look at [the official documentation](https://docs.kubewarden.io/explanations/audit-scanner/policy-reports) to learn more about policy reports.

## New host capability available

Kubewarden provides a set of [host capabilities](https://docs.kubewarden.io/reference/spec/host-capabilities/intro-host-capabilities) that allow
policy authors to access external data during policy evaluation.

Kubewarden 1.11 expands the operations that can be done against a container registry by making it possible to fetch OCI manifests.
This addition was requested by our community as a way to write policies that make use of the platform and architecture information found inside the OCI manifest to make mutations.

The Kubewarden SDKs have been updated to expose this new functionality. We will also publish a dedicated blog post explaining what policy authors can achieve with this new capability.

## Context aware policies optimization

As part of our host capabilities, Kubewarden provides a way to query the Kubernetes API server. This is used to create [context aware policies](https://docs.kubewarden.io/next/reference/spec/context-aware-policies).
These are policies that use information about the state of Kubernetes cluster to make validating/mutating decisions.

Starting from the 1.11 release, Kubewarden uses a different way to fetch information from the Kubernetes API server and keep this data up to date. That brings two major improvements.
Firstly, the load on the Kubernetes API server is reduced. Secondly, the information shared with the policies is significantly fresher than before. That means changes done inside Kubernetes are propagated faster to
the policies.

## Reduce latency of policies that make use of host capabilities

Thanks to a report coming from our community, we learnt that policies making use of host capabilities had too much latency when ran on big clusters.

We started an [investigation](https://github.com/kubewarden/policy-server/issues/692) that led to several performance improvements that are now part of the Kubewarden 1.11 release.

Traditional Kubernetes policies (the ones written using Rust and Go) got a 81% performance boost. Rego policies got a 27% performance improvement.
We also have more optimization for Gatekeeper policies inside of our future pipeline, these changes will bring an extra 55% boost.

## Known bugs

Since the TUF spec v1.0.32 (released 2023-03-02), there is an incomaptibility
when defining ECDSA keys. This means that signature verification in `kwctl` and
`policy-server` will fail-closed, meaning that even if images are correctly
signed, Kubewarden will fail the image verification and report "Image
verification failed: missing signatures".

The change done inside of Sigstore's TUF repository broke the `sigstore-rs` rust library used by Kubewarden, causing also previous versions of Kubewarden to exhibit this behavior.

The issue is currently being worked upstream, we will issue patch releases as soon as possible.

## Stay tuned!

As always, we are curious about what features you would like next and how you are
enjoying Kubewarden. Reach out on [Slack](https://kubernetes.slack.com/?redir=%2Fmessages%2Fkubewarden)
or join our [monthly community meeting](https://teamup.com/ks2bj74dvw132mhjtj?view=a&showProfileAndInfo=0&showSidepanel=1&disableSidepanel=1&showMenu=1&showAgendaHeader=1&showAgendaDetails=0&showYearViewHeader=1)
to talk Kubewarden!
