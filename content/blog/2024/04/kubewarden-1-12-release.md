---
title: Kubewarden 1.12 release
authors:
  - Víctor Cuadrado
date: 2024-04-24
---

Today we're glad to announce the release of Kubewarden 1.12.

This release focuses on optimizations and High-Availability, both oriented to
production.

## Optimizing Gatekeeper policies

On really big clusters (thousands of nodes), Gatekeeper policies that make use
of context-aware data are markedly slower than those written in Go/Rust. This
is because Gatekeeper policies expect a serialized inventory of all Kubernetes
objects they could access under `data.inventory`, for which the policy-server
must spent significant CPU cycles.

Gatekeeper policies in Kubewarden in addition have
`spec.contextAwareResources`, a Kubewarden feature that allows us to fine-tune
the context-aware permissions per policy, and provide more security.

Following requests from the community, for Kubewarden 1.12 we have elected to
cache this `data.inventory` of Gatekeeper policies for performance. The cache,
thanks to `spec.contextAwareResources`, has an increased granularity compared
to vanilla Gatekeeper.

The cache works with sets of resources as defined in the policy rules and
`spec.contextAwareResources`. Hence policies that access the same set of
resources (e.g: all Namespaces with a specific LabelSelector) will share the
same inventory. That cache set is invalidated whenever a resource of that set
changes.

Stay tuned for more performance improvements on next releases!

## Increasing deployment reliability

Thanks to community requests for increasing deployment availability of
Kubewarden, now from 1.12 each [PolicyServer
spec](https://docs.kubewarden.io/next/reference/CRDs#policyserverspec) has
additional fields to configure how you want policy-server Deployments to behave
in the cluster:

- `spec.minAvailable` or `spec.maxUnavailable`: Configure the number of
  policy-server replicas available. The controller will create
  [PodDisruptionBudget](https://kubernetes.io/docs/concepts/workloads/pods/disruptions/#pod-disruption-budgets) objects as needed for these settings.
- `spec.affinity`: [Affinity and anti-affinity rules](https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/#affinity-and-anti-affinity) of the policy-server Pods.
- `spec.limits` and `spec.requests`: Set the [resource limits and requests](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/#resource-requests-and-limits-of-pod-and-container) (cpu,
  memory, etc) of each container of the policy-server Pods.

These new PolicyServer spec fields are now also available for the default
PolicyServer installed via the `kubewarden-defaults` chart.

Head over to [the docs
page](https://docs.kubewarden.io/howtos/policy-servers/production-deployments)
for more information on the PolicyServer spec, and have a look at the new
fields in kubewarden-defaults chart.

## Bug fixes and small features

Several community-prompted bugfixes and features were tackled. The most notable
being:

- Sigstore signature verification in `kwctl` and `policy-server` works again as
  usual. Previously, the Sigstore Rust crate had a regression introduced by the
  release of TUF spec v1.0.32, and Kubewarden failed-closed and reported "Image
  verification failed: missing signatures" even if there were valid signatures.
  This is now solved.
- Verifying policies from private registries with access credentials now works
  in `kwctl` and `policy-server`. As usual, set your authenticatio data in a
  `~/docker/config.json` file for `kwctl`, and see [the
  docs](https://docs.kubewarden.io/howtos/policy-servers/private-registry) on
  creating the Secret for the PolicyServer.
- `policy-server` binaries now have a new feature flag that allows them to
  continue even on policy intialization errors. This provides users with a UX
  where they don't need to check policy-server error logs and each of the
  policies if some is failing (with misconfigured policy settings for example).
  This feature is currently alpha as it needs more polishing. Because of that, this is disabled by default. Users can set the
  env var `KUBEWARDEN_CONTINUE_ON_ERRORS` for policy-server if they wish to
  enable this feature flag.
- The `kubewarden-controller` chart now exposes a value for configuring the
  controller log level.

## Docs keep improving

The docs keep improving ship-of-Theseus style. Lately it has been the turn of
the architecture page, which now features reworded and extended explanations.
Have a look [here](https://docs.kubewarden.io/explanations/architecture).

## Stay tuned!

As always, we are curious about what features you would like next and how you are
enjoying Kubewarden. Reach out on [Slack](https://kubernetes.slack.com/?redir=%2Fmessages%2Fkubewarden)
or join our [monthly community meeting](https://teamup.com/ks2bj74dvw132mhjtj?view=a&showProfileAndInfo=0&showSidepanel=1&disableSidepanel=1&showMenu=1&showAgendaHeader=1&showAgendaDetails=0&showYearViewHeader=1)
to talk Kubewarden
