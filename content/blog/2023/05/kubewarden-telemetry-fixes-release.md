---
title: Telemetry enhancements released!
authors:
- José Guilherme Vanz
date: 2023-05-09
---

We are excited to announce a variety of updates, fixes, and enhancements for Kubewarden components!

This release primarily focuses on improvements to Kubewarden telemetry and dependency updates.

# Telemetry Enhancements and Fixes

The Kubewarden controller has received several fixes and improvements in the telemetry department.
These include a streamlined process for users to deploy a policy server with telemetry enabled,
as well as a bug fix related to the controller's available metrics.

We discovered a bug in the controller where the `policy-count` metric was not being recorded.
Users can now properly utilize this metric in their dashboards to monitor cluster activity.

Additionally, the controller now incorporates all necessary [OpenTelemetry](https://opentelemetry.io/) configurations into
the Policy Servers' definitions to enable telemetry. This means users no longer need to enable
telemetry individually for each policy server deployed within the cluster. Instead, they can enable
telemetry in the Kubewarden controller, which will then appropriately propagate the configuration to
all subsequently deployed policy servers.

As a result, the `kubewarden-defaults` Helm chart has been updated, with the telemetry
configuration removed from its values file.

If you want more information about how to enable telemetry on Kubewarden.
Please, check out our [documentation](https://docs.kubewarden.io/operator-manual/telemetry/opentelemetry/quickstart)!

# Give it a try!

You can test the changes mentioned above by using the Helm charts in the following versions:

- [kubewarden-defaults-1.6.1](https://github.com/kubewarden/helm-charts/releases/tag/kubewarden-defaults-1.6.1)
- [kubewarden-crds-1.3.1](https://github.com/kubewarden/helm-charts/releases/tag/kubewarden-crds-1.3.1)
- [kubewarden-controller-1.5.1](https://github.com/kubewarden/helm-charts/releases/tag/kubewarden-controller-1.5.1)

You can reach out to us on [slack](https://kubernetes.slack.com/?redir=%2Fmessages%2Fkubewarden) or join
our [monthly community meeting](https://teamup.com/ks2bj74dvw132mhjtj?view=a&showProfileAndInfo=0&showSidepanel=1&disableSidepanel=1&showMenu=1&showAgendaHeader=1&showAgendaDetails=0&showYearViewHeader=1)
to talk more about Kubewarden!
