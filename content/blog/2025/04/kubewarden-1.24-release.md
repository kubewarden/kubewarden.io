---
title: Kubewarden 1.24 release
authors:
  - Víctor Cuadrado Juan
date: 2025-04-30
---

The wait is over—Kubewarden 1.24 has arrived! We have some easter eggs for you
in this one.

## Promoting our policies to v1.0.0

In the past, we consciously picked semver `0.X.Y` for policy versions as that
meant that the policy API for the user (in this case, the policy
`spec.settings`) was not considered stable. To be clear, we always ensure
the policy API and ABI between policy-server and the policy is always
compatible.

We haven't needed to review this over the past few years,
so policies kept getting 0.X.0 minor releases, with none breaking backward
compatibility.

So, it is about time we proudly declare that our policies are semver
`v1.0.0`!

We have released most of our policies, those we consider stable,
as `v1.0.0`. This shows our commitment over this time,
now paraded in Semantic Versioning. You can find
[here](https://github.com/kubewarden/community?tab=readme-ov-file#repositories)
a list of policy repositories and their maturity level; note that the
majority are declared stable. Others, like our `kyverno-dsl-policy`, being
experimental, are released with version `0.1.0`.

Benefits to using `v1.0.0` are:

- Policy OCI artifacts are labeled with `org.opencontainers.image.*`. This
  informs tools such as the Renovate bot, where the repo and changelog of the policy
  live, which provides useful metadata when letting bots bump the policies you consume.
- The `kwctl scaffold artifacthub` command was simplified in the previous
  `v1.23` release. Some of its mandatory flags, like the policy version, are now
  read from the `io.kubewarden.policy.version` annotation from the `metadata.yml`
  file.
- We have further automated the release process of our policies, to cut a
  monthly release when possible.

To automate this, we have created new parts in our
[kubewarden/github-actions](https://github.com/kubewarden/github-actions)
v4.4.4:

1. We added a new reusable workflow, `reusable-release-pr`, that can be
   triggered on a schedule. When it runs, it checks for changes from the last
   draft release, and opens a PR with [Updatecli](updatecli.io) if it finds changes. This is done
   via the new
   [`open-release-pr`](https://github.com/kubewarden/github-actions/blob/main/.github/workflows/reusable-release-pr.yml)
   You can find the updatecli policy
   [here](https://github.com/kubewarden/automation/tree/main/updatecli).
2. We have a second reusable workflow,
   [`reusable-release-tag`](https://github.com/kubewarden/github-actions/blob/main/.github/workflows/reusable-release-tag.yml).
   This workflow checks for PRs that the previous workflow opened, and, once the
   maintainers merge the PR, tags the policy so it gets released.

This process works for normal policy repos and monorepos (such as our github.com/kubewarden/rego-policies-library).

## cel-policy v1.3.1 released

The latest release of the cel-policy comes with the [Encoder CEL
extension](https://pkg.go.dev/github.com/google/cel-go/ext#Encoders), which
allows users to encode/decode base64 strings. In addition, it contains bumps of
`github.com/google/cel-go` to v0.23.2, plus `k8s.io/apiserver` and
`k8s.io/apimachinery` to v1.33.0.

## Bugs, minor features and maintenance bumps

As usual, we have kept busy by paying back technical debt for a better future.

The Audit Scanner logs have now moved from consuming zerlog to
[slog](https://pkg.go.dev/log/slog), a structured logging standard library for
Go. If you are consuming the logs, there are no differences in output.
Thanks to Dharmit Shah for the contribution!

The policy-server code that deals with PolicyGroups has been moved into
the policy-evaluator library. Also, we no longer suppress TLS-related
messages, and failed connections will appear at the Info level. Thanks to Kirat for
the contribution! Kirat also made an improvement to kwctl for the registry URLs,
planned for release in v1.25.

For the .NET SDK, we have now our first PR for adding host capabilities, in
this case the network DNS host lookup. Thanks Ibrahim Gaber for the
contribution!

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
