---
title: "Kubewarden 1.29.1 Patch Release"
authors:
  - Flavio Castelli
date: 2025-10-13
---

Today, we released patch updates for both Policy Server and kwctl.

These releases address a startup failure affecting both components,
caused by an issue initializing Sigstore's TUF repository.

With this fix, Policy Server and kwctl will now exit with an error only if policy verification settings are enabled.
Policies using image verification settings will reject all images that rely on Sigstore certificate infrastructure (like keyless signatures).

In the meantime, we are collaborating upstream to resolve the Sigstore issue.

## What you should do

You can download the latest version of `kwctl` from its [GitHub releases page](https://github.com/kubewarden/kwctl/releases) or
you can use package managers like `brew` to update it.

The Kubewarden helm charts have been updated to consume the latest version of the Policy Server container image. Doing a `helm upgrade`
is enough to get the latest version of the Policy Server.

# Getting in touch

Join the conversation on
[Slack](https://kubernetes.slack.com/?redir=%2Fmessages%2Fkubewarden) or
[GitHub discussions](https://github.com/orgs/kubewarden/discussions) and let us
know how you’re finding Kubewarden 1.29!
