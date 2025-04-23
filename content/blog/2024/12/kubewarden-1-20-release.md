---
title: Kubewarden 1.20 release
authors:
  - Víctor Cuadrado Juan
date: 2024-12-19
---

We're excited to announce the release of Kubewarden v1.20! This release brings
a nice improvement for deploying with OpenTelemetry and some bug fixes.

# Supporting more OpenTelemetry scenarios

> ⚠️ **IMPORTANT**⚠️
> The `kubewarden-controller` Helm chart has changed the `values.yml` schema
> for the OpenTelemetry keys, hence this update is not backwards-compatible if
> you have configured OpenTelemetry. Please adapt your values to the new
> `values.yml` format.
>
> This is of course reflected with a major version bump of the chart `version`.

With v1.20, we have expanded the Kubewarden controller capabilities to
configure OpenTelemetry integrations.

Until v1.19 inclusive, one could only configure the `kubewarden-controller` chart to
inject the OpenTelemetry collectors [as a
sidecar](https://opentelemetry.io/docs/collector/architecture/#a-nameopentelemetry-agentarunning-as-an-agent)
into Pods in the Kubewarden stack.

From v1.20 onward, the official Kubewarden Helm chart allows also to
configure the Kubewarden stack to send telemetry and metrics data
to an OpenTelemetry Collector that is managed by the administrator of the
cluster. This
configuration allows for running the Collector [as a Gateway](https://opentelemetry.io/docs/collector/architecture/#a-nameopentelemetry-collectorarunning-as-a-gateway)
in the same cluster. This architecture is useful for example when one wants the
collector to receive tracing and metrics from more than one stack.

To achieve this, we have reformatted the `values.yml` of `kubewarden-controller` to
add a new key `telemetry.mode` which can take either the `sidecar` value or
`custom` value. We have also reorganized the set of keys under `telemetry`.

Here is an example of the `values.yml` for `sidecar` mode:

```yaml
# values.yaml
telemetry:
  mode: sidecar
  tracing: True
  metrics: True
  sidecar:
    tracing:
      jaeger:
        endpoint: "my-open-telemetry-collector.jaeger.svc.cluster.local:4317"
        tls:
          insecure: true
    metrics:
      port: 8080
```

And here is an example for the `custom` mode configuring Kubewarden to point to
a custom OpenTelemetry Collector:

```yaml
# values.yaml
telemetry:
  mode: custom
  metrics: True
  tracing: True
  custom:
    endpoint: "https://my-collector-collector.kubewarden.svc:4317"
    insecure: false
    otelCollectorCertificateSecret: "my-server-cert"
    otelCollectorClientCertificateSecret: "my-client-cert"
```

This Helm chart configuration is used for the Kubewarden controller, which takes
care of configuring each Policy Server instance, including the needed certificates.

We have refreshed our documentation pages to better showcase the sidecar mode,
and added a new [example of the custom mode](https://docs.kubewarden.io/howtos/telemetry/custom-otel-collector).

Would you like to see more capabilities to interact with OpenTelemetry? Don't hesitate
to get in touch!

# Bug Fixes and Dependency Updates

As always, we've addressed bugs and updated dependencies to ensure a smooth and
reliable experience.

Worth noting is a `kwctl` fix when dealing with local custom certificates for
authenticating against OCI repositories when the user incorrectly passes a
certificate in DER format (binary encoded) instead of PEM format (text, ASCII
armored). Before, `kwctl` could stop with an error when trying to load the DER
certificate. Now, `kwctl` has strengthened PEM/DER recognition and `kwctl`
informs better if one is using a DER certificate.

# Getting in touch

As always, we welcome your feedback and contributions. Feel free to reach out
to us on [Slack](https://kubernetes.slack.com/?redir=%2Fmessages%2Fkubewarden)
and [GitHub discussions](https://github.com/orgs/kubewarden/discussions).
