---
title: "Runtime Enforcer 0.11 Release"
authors:
  - Flavio Castelli
date: 2026-11-19
components:
  - Runtime Enforcer
types:
  - release
---

A new release of Runtime Enforcer just landed: [`v0.11.0`](https://github.com/kubewarden/runtime-enforcer/releases/tag/v0.11.0) 🥳

This release includes several fixes and a new CLI utility. It also has breaking changes in the Helm chart
and in the telemetry export. Before you upgrade, read the [upgrade notes](#upgrade-notes).

## `wpgen`: draft and check policies without a cluster

Before this release, you got a `WorkloadPolicy` from the learn phase in a cluster,
or you wrote it by hand. This release adds `wpgen`, a new standalone command line tool.

`wpgen` reads the executables in container images and writes a draft of a `WorkloadPolicy`.
It does not need a cluster, so you can run it on a workstation or in a CI
pipeline.

### Draft a policy without running the container

`wpgen` drafts a `WorkloadPolicy` from one image, or from a workload file such
as the output of `helm template`:

```console
wpgen image docker.io/library/nginx:1.27
helm template my-release ./chart | wpgen workload -
```

The draft starts in `monitor` mode. It allows every program and script of the
image, so you must trim it and test it before you use `protect` mode.

### Find images with too many executables

`wpgen` reports how many executables each image contains. If a container
allows more than 50 executables, `wpgen` prints a warning. For example,
`nginx:1.27` contains 504 executables, and a container usually runs only a few
of them.

An image with hundreds of executables has an attack surface that is too large.
`wpgen` raises awareness of this problem. Its report shows the number of
executables for each image. A CI pipeline can use this number to find these
images, block them, and notify their authors.

### Find out if a policy still matches a new release

You have a `WorkloadPolicy` for version 1.0.0 of your application. Then
version 1.1.0 comes out, and you want to know if the policy is still valid.
`wpgen check` answers this question before you deploy the new version:

```console
wpgen check policy.yaml --image ghcr.io/example/my-app:1.1.0 --list-not-allowed
```

`wpgen check` compares the paths that the policy allows with the executables
of the new image. The policy can come from the learn phase or from `wpgen`.
The report shows two kinds of difference:

- Stale paths: the policy allows them, but the new image does not contain
  them. The new release removed or renamed these executables.
- Executables of the new image that the policy does not allow. A new
  executable that the application might need is in this list.

If the report has a stale path, `wpgen check` exits with code `1`. As a result,
a CI job can run it at each image update.

### Get `wpgen`

The `wpgen` binaries are part of the
[GitHub release](https://github.com/kubewarden/runtime-enforcer/releases/tag/v0.11.0).
They are available for Linux and macOS, on amd64 and arm64. The
[CLI reference](https://docs.kubewarden.io/runtime-enforcer/0.11/en/reference/wpgen-cli.html)
lists all the commands and flags.

## Helm chart: new layers for the values

The values of the chart have three layers: `global`, `common`, and the block
of each workload (controller, agent, debugger).

The chart merges maps, and it adds the lists of named items together. If two layers set the same key, the
block of the workload wins.

The chart has these new keys:

- `global.imageRegistry`
- `extraEnv` and `extraEnvFrom`
- `extraVolumes` and `extraVolumeMounts`
- `topologySpreadConstraints`
- `priorityClassName`
- Labels and annotations for each workload

These values moved or changed:

| v0.10                                | v0.11                                                                                                             |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| Top-level `imagePullSecrets`         | `global.imagePullSecrets`                                                                                         |
| `controller.pdb`                     | `controller.podDisruptionBudget`                                                                                  |
| `env` in a workload block            | `extraEnv`                                                                                                        |
| `controller.args` and `agent.args`   | Removed                                                                                                           |
| `image.repository` with the registry | `image.registry` (for example `ghcr.io`) and `image.repository` (for example `kubewarden/runtime-enforcer/agent`) |

The debugger also has a `podDisruptionBudget` block.

The chart no longer passes `--metrics-bind-address` to the controller, so the
controller no longer serves a metrics endpoint on port 8443. The chart also no
longer creates the `metrics-auth` and `metrics-reader` ClusterRoles.

The documentation explains
[the layers of the chart values](https://docs.kubewarden.io/runtime-enforcer/0.11/en/howtos/production-deployments.html#_chart_values_layers).

## Telemetry: use your own OpenTelemetry collector

Before, the chart deployed an OpenTelemetry collector by default. This release
removes the bundled collector and the `telemetry` block of the values. You
deploy the collector, and you give its URL to the chart:

```yaml
global:
  otel:
    endpoint: https://otel-collector.observability.svc.cluster.local:4317
```

The export is off until you set `global.otel.endpoint`. Runtime Enforcer still
shows violations without telemetry, in the `status` of each `WorkloadPolicy`.

The rules for the endpoint are stricter:

- The endpoint must be a URL that starts with `http://` or `https://`. With a
  value such as `collector:4317`, the controller and the agent do not start.
- An `https://` URL selects TLS. Without a CA Secret, the controller and the
  agent trust only public certificate authorities (CAs). In v0.10, a missing
  CA Secret turned off TLS verification.
- `global.otel.caSecretName` names the Secret of a private CA.
- `global.otel.clientCertificateSecretName` names the Secret of a client
  certificate, for mutual TLS.
- The controller and the agent no longer have the `--otlp-*` flags. They read
  the standard `OTEL_EXPORTER_OTLP_*` environment variables through the
  OpenTelemetry SDK.

The
[telemetry page](https://docs.kubewarden.io/runtime-enforcer/0.11/en/howtos/telemetry.html)
has the full procedure.

## Provenance and signatures for the release artifacts

This release changes how we build and sign the release artifacts:

- Container images: the shared Kubewarden reusable workflow builds the images,
  with SLSA Build L3 provenance (a signed record of how a build ran). The
  identity of the signer changed, so the `cosign` commands for the images are
  different.
- `kubectl-runtime_enforcer` and `wpgen` binaries: each binary has SLSA Build
  L3 provenance, an SPDX SBOM (a list of the components of the binary), and a
  keyless `cosign` signature.
- Base images: the controller and the agent moved from `scratch` to distroless
  images. The controller uses the `nonroot` variant.

The
[Verifying Runtime Enforcer](https://docs.kubewarden.io/runtime-enforcer/0.11/en/tutorials/verifying-runtime-enforcer.html)
tutorial has the commands for the images, the binaries, and the Helm chart.

## Other improvements and bug fixes

- Runtime Enforcer no longer reports, blocks, or learns the executions that an
  OCI runtime does at the start of a container, such as `runc init`. This
  removes false positives.
- The delete webhook ignores Pods in the `Succeeded` or `Failed` phase. As a
  result, the Pods of finished Jobs and CronJobs no longer block the deletion
  of a `WorkloadPolicy`.
- The `podLabels` value can no longer replace the labels that the chart owns.
  Before, this broke the selectors.
- The `values.schema.json` file of the chart references the upstream
  Kubernetes schemas. It accepts valid fields such as `capabilities.add` and
  `resources.limits.ephemeral-storage`.
- The CRD reference shows the optional fields correctly.
- The Rancher version annotation of the chart is 2.16.
- The project uses Go 1.27.4, with updates of the Kubernetes libraries, the
  OpenTelemetry SDK, gRPC, and NRI.
- The gRPC code generation uses `buf`.
- We accepted RFC 0009, about a configurable behavior for a missing
  `WorkloadPolicy`. This release does not contain the implementation.

## Upgrade notes

Runtime Enforcer supports the upgrade from `0.10.x` to `0.11.0`. It does not
support an upgrade across more than one minor version.

**CAUTION:** do not use `helm upgrade --reuse-values`. With this option, Helm
keeps the old image tags, and the Pods run the v0.10 images.

1. Before you upgrade, update your Helm values file. The chart ignores a value
   that it does not know, and it gives no error.
2. If you want to keep the telemetry export, deploy your own OpenTelemetry
   collector. The upgrade removes the bundled collector.
3. Set `global.otel.endpoint` to the URL of your collector.
4. If a workload in `protect` mode runs files through `/proc/<pid>/root`, set
   `ALLOW_FOREIGN_ROOT_EXEC` in its policy. Without this option, Runtime
   Enforcer blocks these executions.
5. Give your updated values file to Helm with the `-f` option:

   ```console
   helm upgrade runtime-enforcer kubewarden/runtime-enforcer \
     --namespace runtime-enforcer \
     -f values.yaml \
     --wait
   ```

The
[upgrade path](https://docs.kubewarden.io/runtime-enforcer/0.11/en/reference/upgrade-path.html)
page lists every change between v0.10 and v0.11.

## Getting in touch

To ask a question or to report a problem, join us on
[Slack](https://kubernetes.slack.com/?redir=%2Fmessages%2Fkubewarden) or open
a thread in
[GitHub discussions](https://github.com/orgs/kubewarden/discussions).
