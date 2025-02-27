---
title: Kubewarden 1.22 release
authors:
  - Víctor Cuadrado Juan
date: 2025-02-26
---

We're excited to announce the release of Kubewarden v1.22! This release
brings some improvements to `kwctl` and the Rust SDK, together with some
internal changes to prepare for future work.

## Breaking change: PolicyServer health check endpoint change

> ⚠️ **IMPORTANT**⚠️
> Breaking change: If you have created a custom instance of PolicyServer with a
> hard-coded `.spec.image`, you must update it to consume the `v1.22.0` tag.
>
> Starting from 1.22, the Policy Server health check endpoint is exposed on port
> 80 instead of port 443, and Policy Server Deployment objects created by the
> kubewarden-controller make this assumption.
>
> This is reflected in major chart `version` bumps for both
> kubewarden-controller and kubewarden-defaults chart,
> as neither are backwards-compatible with older versions of each other.

This change is motivated by our ongoing work in providing mutual TLS
deployments on the Kubewarden stack.

## kwctl now adds OCI annotations when pushing policies

When pushing a policy with `kwctl push`, `kwctl` now adds Kubewarden
annotations from the policy's metadata into the resulting OCI manifest.
Multi-line annotations will be skipped since they are not compliant with the
OCI spec.

Moreover, the `io.kubewarden.policy.source` annotation is propagated as
`org.opencontainers.image.source`. This allows tools like [Renovate
bot](https://docs.renovatebot.com/modules/datasource/docker/#description) to
nicely display policy updates by sharing their source repository tag, changelog
and so on.

The policies maintained by the Kubewarden team will steadily be pushed with
these new annotations.

## Bump to Policy Reporter v3, UI v2

We are happy to announce that we have bumped the Policy Reporter subchart in
our `kubewarden-controller` to Policy Reporter V3 and its v2 UI. We
congratulate the Policy Reporter authors on their new release! Head over to [their
page](https://kyverno.github.io/policy-reporter/) for more information on new
features.

On the Kubewarden side, we have configured a Dashboard to show only Kubewarden
policies (see `.Values.policy-reporter` in the `kubewarden-controller` chart):

{{<figure src="/images/policy-reporter_kubewarden-filter.png" alt="screenshot of the Policy Reporter UI v2 dashboard"  >}}

Also stay tuned, as the authors of Policy Reporter have joined https://openreports.io.

## Rust SDK v0.13.x now has built-in types for Kubewarden CRDs

The Rust SDK now [contains types](https://docs.rs/kubewarden-policy-sdk/latest/kubewarden_policy_sdk/crd/index.html) for the Kubewarden CRDs, such as
`ClusterAdmissionPolicies`, `PolicyServers`, etc. These types are toggled by a new
crate feature, `crd`. These types are consistent with the `k8s-openapi` crate
(using `Option<T>`), and are useful to those policy authors that want to write
context-aware policies that deal with Kubewarden policies themselves.

## Internal policy-server policy.yaml field rename

Currently, policies hosted by a Policy Servers are configured via a `policy.yaml` file, created as a
`ConfigMap` by our controller. For consistency reasons, we have changed the
format of this policy.yaml file to match the format of policies defined in our
CRDs by renaming the `url` field to `module`. This also allowed us to simplify
our controller by removing translation logic.

This is a breaking change, but only impacts users using a Policy Server without
the Kubernetes controller, such as raw policy users.

## Bug fixes and dependency updates

As always, we've addressed bugs and updated dependencies to ensure a smooth experience.
Worth noting is a Policy Server bug fix for certificate hot-reload, which could
make the Policy Server stop with a panic if the certificate was malformed,
stopping the hot-reload mechanism. Now, it will error, but will accept a fixed
certificate.

On the maintenance side, the OpenTelemetry libraries have been bumped for both
the controller and Policy Server.

## Getting in touch

As always, we welcome your feedback and contributions. Feel free to reach out
to us on [Slack](https://kubernetes.slack.com/?redir=%2Fmessages%2Fkubewarden)
and [GitHub discussions](https://github.com/orgs/kubewarden/discussions).
