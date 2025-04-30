---
title: Kubewarden 1.24 release
authors:
  - Víctor Cuadrado Juan
date: 2025-04-30
---

The wait is over, Kubewarden 1.24 has arrived! We have some Easter eggs for you
in this one.

## Promoting our policies to v1.0.0

In the past, we consciously picked semver `0.X.Y` for policy versions as that
meant that the policy API for the user (in this case, the policy
`spec.settings`) was not considered stable.

Since the settings of our policies haven't changed since their initial release,
we decided it was time to highlight their stability by promoting them to `v1.0.0`.

We have released most of our policies, those we consider stable,
as `v1.0.0`. This shows our commitment over time,
now paraded in Semantic Versioning. You can find
[here](https://github.com/kubewarden/community?tab=readme-ov-file#repositories)
a list of policy repositories and their maturity level; note that the
majority are declared stable. The ones that are still considered experimental,
like the `kyverno-dsl-policy` one, have not reached `v1` yet.

During the last months we have also worked on improving the automation pipelines
used to build all our policies, both the stable and the experimental ones.
That led to the following enrichment:

- Policy OCI artifacts are labeled with `org.opencontainers.image.*` labels. This
  information can be used by automation tools like Renovate or Dependabot to react
  to new policy releases. For example, it would be possible to have Renovate create
  pull requests to bump the policy version consumed by a `ClusterAdmissionPolicy`
  definition.
- The `kwctl scaffold artifacthub` command was simplified in the previous
  `v1.23` release. Some of its mandatory flags, like the policy version, are now
  read from the `io.kubewarden.policy.version` annotation from the `metadata.yml`
  file.
- Kubewarden policies are real code, using compilers and 3rd party libraries. We already
  had automation in place to keep the policies dependencies up to date. Now, we also
  have automation that cuts monthly patch releases of each policy to ensure
  all these fresh dependencies are available to you.

To automate this, we have created new parts in our
[kubewarden/github-actions](https://github.com/kubewarden/github-actions)
v4.4.4:

1. We added a new reusable workflow, `reusable-release-pr`, that can be
   triggered on a schedule. When it runs, it checks for changes from the last
   draft release, and opens a PR with [Updatecli](updatecli.io) if it finds changes. This is done
   via the new
   [`open-release-pr`](https://github.com/kubewarden/github-actions/blob/main/.github/workflows/reusable-release-pr.yml) reusable workflow.
   You can find the updatecli policy
   [here](https://github.com/kubewarden/automation/tree/main/updatecli).
2. We have a second reusable workflow,
   [`reusable-release-tag`](https://github.com/kubewarden/github-actions/blob/main/.github/workflows/reusable-release-tag.yml).
   This workflow checks for PRs that the previous workflow opened, and, once the
   maintainers merge the PR, tags the policy so it gets released.

This process works for normal policy repos and monorepos, such as
[the one](https://github.com/kubewarden/rego-policies-library) that holds all our
rego policies.

## cel-policy v1.3.1 released

The latest release of the cel-policy comes with the [Encoder CEL
extension](https://pkg.go.dev/github.com/google/cel-go/ext#Encoders), which
allows users to encode/decode base64 strings. In addition, it contains bumps of
`github.com/google/cel-go` to v0.23.2, plus `k8s.io/apiserver` and
`k8s.io/apimachinery` to v1.33.0.

## Bugs, minor features and maintenance bumps

As usual, we have kept busy by paying back technical debt for a better future.

### Audit scanner

The Audit Scanner logs have now moved from consuming [zerolog](https://github.com/rs/zerolog) to
[slog](https://pkg.go.dev/log/slog). The latter is a structured logging library
that is part of Go's official standard library. We did this change to
reduce our dependency tree.
If you are consuming the logs, there are no differences in output.
Thanks to Dharmit Shah for the contribution!

### Policy server & kwctl

The policy-server code that deals with [policy groups](https://docs.kubewarden.io/howtos/policy-groups) has been moved the
[policy-evaluator library](https://github.com/kubewarden/policy-evaluator/).
This refactoring paves the way for future improvements to `kwctl`, like being able
to use `kwctl run` to evaluate policy groups.

Finally, when the Kubewarden stack is [hardened using
mTLS](https://docs.kubewarden.io/reference/security-hardening/webhooks-hardening#require-the-kubernetes-api-server-to-authenticate-to-the-webhook),
the Policy Server instances will
log all the connection attempts done by client that cannot be identified/trusted.

### Maintenance bumps

We have addressed some CVEs in our dependency tree (e.g., `golang.org/x/net`).
For others, consuming the fixes needs to propagate through our dependencies.
The bumps also include the Policy Reporter subchart to 3.1.3. We also migrated
to golangci-lint v2 with a golden config and refactored as needed by linters.

## Google Summer of Code

We await the decision from the Google Summer of Code administrators regarding
our projects. Fingers crossed! We thank those who have been
stretching their Kubewarden muscles and contributing.

## Getting in touch

Join the conversation on
[Slack](https://kubernetes.slack.com/?redir=%2Fmessages%2Fkubewarden)
or
[GitHub discussions](https://github.com/orgs/kubewarden/discussions).
and let us know how you're using Kubewarden 1.24!
