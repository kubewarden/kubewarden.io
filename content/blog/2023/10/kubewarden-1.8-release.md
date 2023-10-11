---
title: Kubewarden 1.8.0 release
authors:
  - Víctor Cuadrado
date: 2023-10-11
---

Today we are happy to announce the release of Kubewarden 1.8.0! 🎉🥳

This is a small release, focused on [OpenTelemetry](https://opentelemetry.io/).

The OpenTelemetry Protocol (OTLP) got its [first 1.0.0
version](https://github.com/open-telemetry/opentelemetry-proto/releases/tag/v1.0.0)
in July 2023; several
libraries got their first 1.0.0 release, such as the [Go metric
SDK](https://opentelemetry.io/blog/2023/otel-go-metrics-sdk-stable/) or the
[.NET Automatic
Instrumentation](https://opentelemetry.io/blog/2023/otel-dotnet-auto-instrumentation/).

Still, the OpenTelemetry stack is not yet stable, and unannounced backwards-incompatible
changes still happen. You can have a look at the status of each of their
libraries and protocols [here](https://opentelemetry.io/status).

For Kubewarden, this means we should expect more users to configure and fine
tune the deployment to fit their stacks.

## Changes

With 1.8.0, the Kubewarden Controller now separately reconciles the configuration of both
tracing and metrics for Policy Server instances. In the past, enabling metrics in
Kubewarden meant enabling both, and now users can decide to enable each separately, as we
have realized from the requests raised by the community.

We have made the concious decision to make this a breaking change in the helm
chart `values.yaml`, which is uncommon.
We think it simplifies the adoption of OTLP changes in the future.

The change is the following:

```diff
# values.yaml
# open-telemetry options
telemetry:
- enabled: False
  metrics:
+   enabled: False
    port: 8080
  tracing:
+   enabled: False
    jaeger: {}
    # OTLP/Jaeger endpoint to send traces to
    # endpoint: "all-in-one-collector.jaeger.svc.cluster.local:4317"
```

#### Example

Up until 1.7.x inclusive we had:

```yaml
---
# values.yaml
# Up until 1.7.x inclusive
telemetry:
  enabled: True
  metrics:
    port: 8080
  tracing:
    jaeger:
      endpoint: "my-open-telemetry-collector.jaeger.svc.cluster.local:14250"
      tls:
        insecure: true
```

Starting with 1.8.0 we have:

```yaml
---
# values.yaml
# Starting with 1.8.0:
telemetry:
  metrics:
    enabled: True
    port: 8080
  tracing:
    enabled: True
    jaeger:
      endpoint: "my-open-telemetry-collector.jaeger.svc.cluster.local:4317"
      tls:
        insecure: true
```

## Configuring OpenTelemetry manually

As always, users may still configure metrics and/or tracing support themselves,
as desired. For example in case that they want only some of the Kubewarden
workloads with telemetry, or more exotic configurations.

This would mean leaving the default values.yaml, and performing the following
by hand:

1. Instantiating their own `OpenTelemetryCollector`.
2. Making sure the OTLP collector can consume data from Kubewarden workloads. For example by using a sidecar, and adding the
   "sidecar.opentelemetry.io/inject": "true" annotations to the kubewarden-controller and PolicyServers.
3. Configuring kubewarden-controller and PolicyServers binaries to enable metrics and tracing via their env vars.

## See you around!

As always, we are curious of what features you would like next and how you are
enjoying Kubewarden. Reach out to us on [slack](https://kubernetes.slack.com/?redir=%2Fmessages%2Fkubewarden)
or join our [monthly community meeting](https://teamup.com/ks2bj74dvw132mhjtj?view=a&showProfileAndInfo=0&showSidepanel=1&disableSidepanel=1&showMenu=1&showAgendaHeader=1&showAgendaDetails=0&showYearViewHeader=1)
to talk more about Kubewarden!
