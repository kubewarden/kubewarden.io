---
title: kwctl 1.22.1 patch release
authors:
  - Flavio Castelli
date: 2025-03-04
---

Today we published the 1.21.1 patch release of kwctl.

This release includes a fix for a bug that, under certain circumstances, could prevent users from pushing policies to a container registry.

The 1.22.0 release introduces the ability to add policy annotations to the manifest of the OCI artifact that is pushed to the container registry. This feature is useful for adding metadata to the OCI artifact that can be utilized by other tools in the CI/CD pipeline.

We realized that some non-compliant types of annotation values were not caught by the validation logic. This caused the OCI manifest to be rejected by the remote OCI registry at push time.

As usual, this release is available on the [GitHub releases page](https://github.com/kubewarden/kwctl/releases/tag/v1.22.1).

## Getting in touch

As always, we welcome your feedback and contributions. Feel free to reach out
to us on [Slack](https://kubernetes.slack.com/?redir=%2Fmessages%2Fkubewarden)
and [GitHub discussions](https://github.com/orgs/kubewarden/discussions).

