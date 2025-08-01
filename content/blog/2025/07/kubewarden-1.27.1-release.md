---
title: "Kubewarden 1.27.1 Patch Release"
authors:
  - Víctor Cuadrado Juan
date: 2025-08-01
---

We have just released 1.27.1, a small patch release for `kwctl`.

With [1.27](./kubewarden-1.27-release.md), `kwctl` CLI now performs post-policy
processing validations previously only done by the `policy-server`. This
includes checking for the policy mode, as in `spec.mode` being `monitor` or
`protect`. This was achieved by refactoring the code in the policy-server and
moving it to our library, `policy-evaluator`.

With this change, we introduced a regression in the command `kwctl run`, used
to run policies. The regression consists in `kwctl run` expecting the
`spec.mode` as `Monitor` or `Protect`, in uppercase instead of lowercase. Given
that when `spec.mode` is not defined, it takes the default value of `Protect`,
this would result in an error.

The newly released kwctl version `v1.27.1` restores the behaviour of `kwctl
run`, which now expects this values in lowercase, keeping compatibility
with the rest of the stack.

## Getting in touch

Join the conversation on
[Slack](https://kubernetes.slack.com/?redir=%2Fmessages%2Fkubewarden) or
[GitHub discussions](https://github.com/orgs/kubewarden/discussions) and let us
know how you’re using Kubewarden!
