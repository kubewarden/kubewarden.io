---
title: "Kubewarden 1.25 Release: Priority Class Support and CI Security Enhancements"
authors:
  - José Guilherme Vanz
date: 2025-05-15
---

Kubewarden 1.25 arrives with enhanced Kubernetes Priority Class integration
across the stack, improved CI security through GitHub Actions cleanup, and
usability refinements in the kwctl tool.

## Priority Class support

A key feature of this release is the comprehensive integration of [Kubernetes
Priority
Classes](https://kubernetes.io/docs/concepts/scheduling-eviction/pod-priority-preemption/)
across the entire Kubewarden stack. This allows for fine-grained control over
the scheduling and resource allocation of Kubewarden components and other
workloads in the cluster. Notably, the Kubewarden Helm charts now include a new
value, `.global.priorityClassName`. This `priorityClassName` is applied to the
controller deployment pods and the pods of the default policy server. Further
details can be found in the [official
documentation](https://docs.kubewarden.io/howtos/production-deployments).

The `PolicyServer` Custom Resource Definition (CRD) has been updated to include
an optional `spec.priorityClassName` field. By specifying a Priority Class name
here, administrators can dictate the priority assigned to the `PolicyServer`
deployment's pods. More information is available in the Kubewarden
[documentation](https://docs.kubewarden.io/howtos/policy-servers/production-deployments#configuring-priorityclasses).

During the Kubewarden 1.25 development cycle, we also introduced a new
[policy](https://github.com/kubewarden/priority-class-policy), the
`priority-class-policy`, to evaluate the `priorityClassName` of workload
resources. This enables the enforcement of organizational standards or best
practices regarding the priority assigned to different applications and
services running within the cluster. The policy can be used to ensure that
critical workloads have appropriate priority levels assigned or to restrict the
use of certain Priority Classes based on defined criteria. The policy
configuration is straightforward, utilizing a list of allowed `PriorityClass`
names that users can specify in the Pod's `priorityClassName` field. Here's a
simple example demonstrating how to ensure that specific namespaces can only
use predefined `PriorityClass` names:

```yaml
apiVersion: policies.kubewarden.io/v1
kind: ClusterAdmissionPolicy
metadata:
  annotations:
    io.kubewarden.policy.category: Resource validation
    io.kubewarden.policy.severity: medium
  name: priority-class-policy
spec:
  module: ghcr.io/kubewarden/policies/priority-class-policy:latest
  rules:
    - apiGroups:
        - ""
      apiVersions:
        - v1
      resources:
        - pods
      operations:
        - CREATE
        - UPDATE
  mutating: false
  namespaceSelector:
    matchExpressions:
      - key: "kubernetes.io/metadata.name"
        operator: In
        values: [team1, team2]
  settings:
    allowed_priority_classes:
      - low-priority
      - med-priority
      - high-priority
```

## GitHub Actions Security Cleanup

Also during the `v1.25` cycle, we conducted an audit of the Kubewarden
organization's GitHub Actions. Consequently, we decided to move away from
GitHub Actions that are deprecated, out of date, or maintained by single
individuals. Therefore, we replaced several GitHub Actions with others under
the control of organizations or by directly calling commands that achieve the
same functionality. Among the replaced actions are `actions-rs/*`,
`peter-evans/*`, and `peaceiris/*` actions. This improves the security of our
development workflows.

## Dependency Updates and kwctl Improvements

As always, we performed numerous dependency updates across all our
repositories. Furthermore, we updated our Rust repositories to include the
`rust-toolchain.toml` file. This simplifies the removal of some deprecated
GitHub Actions and allows us to define the toolchains and targets used to build
each project within a configuration file.

The `kwctl` tool received an
[enhancement](https://github.com/kubewarden/kwctl/pull/1169) from a community
member! Now, the tool no longer requires users to add the `registry://` prefix
to delete a policy. A big thank you to our community member
[@manukirat](https://github.com/manukirat)! Your contribution significantly
improves the usability of our tooling.

# Getting in touch

Join the conversation on
[Slack](https://kubernetes.slack.com/?redir=%2Fmessages%2Fkubewarden) or
[GitHub discussions](https://github.com/orgs/kubewarden/discussions) and let us
know how you’re using Kubewarden 1.25!
