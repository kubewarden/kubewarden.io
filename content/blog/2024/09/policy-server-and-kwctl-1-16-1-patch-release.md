---
title: Policy Server and kwctl 1.16.1 patch releases
authors:
  - Flavio Castelli
date: 2024-09-04
---

# Policy Server and kwctl 1.16.1 patch releases

Today we published the 1.16.1 patch release of Policy Server and kwctl.

The release addresses a breaking change inside [Sigstore's](https://sigstore.dev)
[TUF](https://theupdateframework.io/) repository. The change caused errors while retrieving the contents of the TUF repository,
which broke part of Kubewarden's integration with Sigstore.

More specifically, it was no longer possible to verify the signatures of Kubewarden's policies and to verify the signatures of
the container images used inside of a Kubernetes cluster via policies like [`verify-image-signatures`](https://artifacthub.io/packages/kubewarden/verify-image-signatures/verify-image-signatures).

## How to upgrade

The freshly released [kubewarden-defaults-2.3.1](https://github.com/kubewarden/helm-charts/releases/tag/kubewarden-defaults-2.3.1) helm chart
ensures the `default` Policy Server uses the 1.16.1 image.
Upgrading to this version of the helm chart will cause the Policy Server to consume the 1.16.1 version.

For Policy Servers defined in other ways, it's necessary to update the [`.image` field of the Policy Server Custom Resource](https://doc.crds.dev/github.com/kubewarden/kubewarden-controller/policies.kubewarden.io/PolicyServer/v1@v1.16.0#spec-image)
to reference the 1.16.1 image.

## Getting in touch

As always, you can contact us through [Slack](https://kubernetes.slack.com/?redir=%2Fmessages%2Fkubewarden) and
[GitHub discussions](https://github.com/orgs/kubewarden/discussions).
