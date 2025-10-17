---
title: "Policy Server 1.29.2 Patch Release"
authors:
  - Flavio Castelli
date: 2025-10-17
---

Earlier this week we published a patch release of Policy Server. The fix was required to avoid a crash at startup time.

The crash was caused by some changes inside the Sigstore TUF repository, specifically the introduction of a new public key for the Rekor service. The Rust library we use to interact with Sigstore could not handle this change, resulting in an error.

The patch we issued on Monday allowed Policy Server to continue operating in a degraded mode. Everything worked as expected except for signature verification, which always failed with an error.

During the week we worked to produce a proper fix inside the upstream library we use. Today, we're happy to announce a new patch release of Policy Server that restores signature verification functionality.

## What you should do

The Kubewarden Helm charts have been updated to use the latest Policy Server container image. To update, simply run `helm upgrade` to deploy the newest version of Policy Server.

Note: This upgrade only affects the `default` Policy Server deployed by the `kubewarden-defaults` Helm chart. If you have custom PolicyServer instances defined, you will need to patch those manually.

# Getting in touch

Join the conversation on
[Slack](https://kubernetes.slack.com/?redir=%2Fmessages%2Fkubewarden) or
[GitHub discussions](https://github.com/orgs/kubewarden/discussions) and let us
know how you’re finding Kubewarden 1.29!
