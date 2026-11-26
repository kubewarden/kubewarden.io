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

This release includes several fixes and a new command line tool. It also contains
breaking changes in the Helm chart and in the telemetry export. Before you
upgrade, read the [upgrade notes](#upgrade-notes).

## `wpgen`: draft and check policies without a cluster

Before this release, you would promote a `WorkloadPolicyProposal` from the learn
phase, or you had to write the policy by hand. This release adds `wpgen`, a new
standalone command line tool that drafts a `WorkloadPolicy` from the contents of
a container image. It does not need a cluster, so you can run it on a
workstation or in a CI pipeline.

### Draft a policy without running the container

`wpgen` drafts a `WorkloadPolicy` from one image, or from a workload file such
as the output of `helm template`:

```console
wpgen image docker.io/library/nginx:1.27
helm template my-release ./chart | wpgen workload -
```

The draft starts in `monitor` mode and allows every program and script from the
image. It cannot inspect files in volumes, files that the workload creates at
runtime, or files in foreign root file systems. Trim the allow-list and test the policy in monitor
mode before you switch it to `protect` mode.

### Find images with too many executables

`wpgen` reports how many executables each image contains. When the count exceeds
50, `wpgen` prints a warning. For example, `docker.io/library/nginx:1.27`
contains 504 executables but an nginx container usually only runs a few of those
binaries.

A policy that allowlists all 504 executables is too lax and prevents nearly
nothing. `wpgen` therefore alerts you in such a case, so you can use it as a
gating check in a CI pipeline.

### Find out if a policy still matches a new application version

Given a `WorkloadPolicy` for version 1.0.0 of your application, you have to know
whether the policy is still valid for version 1.1.0. `wpgen check` answers this
question before you deploy the new version:

```console
wpgen check policy.yaml --image ghcr.io/example/my-app:1.1.0 --list-not-allowed
```

`wpgen check` compares the paths that the policy allows with the executables in
the new image. It does not matter whether the policy came from the learn phase or
from `wpgen`. The report shows two kinds of differences:

- Stale paths: the policy allows them, but the new image does not have them
  as executables. The new version may have removed or renamed them.
- Executables of the new image that the policy does not allow. `wpgen` lists
  them only with `--list-not-allowed`, as the count is usually high.

`wpgen check` exits with code `1` when an allowed path is stale, or when a
container of the workload has no rules in the policy. A CI job can therefore use
the exit code for blocking an application update.

### Get `wpgen`

The `wpgen` binaries are part of the
[GitHub release](https://github.com/kubewarden/runtime-enforcer/releases/tag/v0.11.0).
They are available for Linux and macOS, on amd64 and arm64. The
[CLI reference](https://docs.kubewarden.io/runtime-enforcer/0.11/en/reference/wpgen-cli.html)
lists all the commands and flags.

## Helm chart: new layers for the values

The values of the chart have three layers: `global`, `common`, and the block
of each workload (controller, agent, debugger).

The chart merges maps, and it concatenates the four lists: `extraEnv`,
`extraVolumes`, `extraVolumeMounts`, and `imagePullSecrets` in the order
`global`, `common` and finally the workload block. For any other key, the block
from the workload wins. The exception is `global.imageRegistry`, which replaces
`image.registry` in every workload block. The telemetry values have their own
rule: the top-level `otel` takes precedence over `global.otel`.

The chart has these new keys:

- `global.imageRegistry`
- `extraEnv` and `extraEnvFrom`
- `extraVolumes` and `extraVolumeMounts`
- `topologySpreadConstraints`
- `priorityClassName`
- `labels` and `annotations` for the workload objects

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

Before 0.11, the chart deployed an OpenTelemetry collector by default. This
release removes the bundled collector and the `telemetry` block of the
values. You have to deploy the collector yourself and pass its URL to the chart:

```yaml
global:
  otel:
    endpoint: https://otel-collector.observability.svc.cluster.local:4317
```

The export is off until you set `global.otel.endpoint`. Without telemetry,
Runtime Enforcer still reports violations in the `status` of each
`WorkloadPolicy`.

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
  the standard `OTEL_EXPORTER_OTLP_*` environment variables instead.

The
[telemetry page](https://docs.kubewarden.io/runtime-enforcer/0.11/en/howtos/telemetry.html)
has the full procedure.

## Provenance and signatures for the release artifacts

This release changes how we build and sign the release artifacts:

- Container images: the Kubewarden reusable workflow builds the images,
  with SLSA Build L3 provenance (a signed record of how a build ran). The
  identity of the signer changed, so the `cosign` commands for the images have
  changed.
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
  OCI runtime performs at the start of a container, such as `runc init`. This
  removes false positives. The exclusion does not work on nodes that isolate the
  container runtime in a private mount namespace. On these nodes, Runtime
  Enforcer still reports the OCI runtime executions.
- The delete webhook ignores Pods in the `Succeeded` or `Failed` phase. As a
  result, the Pods of finished Jobs and CronJobs no longer block the deletion
  of a `WorkloadPolicy`.
- The `podLabels` value can no longer replace the labels that the chart owns.
  Before this release, replacing them broke the selectors.
- The `values.schema.json` file of the chart references the upstream
  Kubernetes schemas. It accepts valid fields such as `capabilities.add` and
  `resources.limits.ephemeral-storage`.
- The chart supports Rancher up to version 2.16.
- The project uses Go 1.27.4, with updates to the Kubernetes libraries, the
  OpenTelemetry SDK, gRPC, and NRI.
- The gRPC code generation uses `buf`.
- We accepted RFC 0009, about a configurable behavior for a missing
  `WorkloadPolicy`. This release does not contain the implementation.

## Upgrade notes

Runtime Enforcer supports upgrading from 0.10.x to 0.11.0. Direct upgrades
spanning more than one minor version are not supported.

**CAUTION:** do not use `helm upgrade --reuse-values`. With this option, Helm
keeps the old image tags, and the Pods run the v0.10 images.

1. Before you upgrade, update your Helm values file. The chart silently
   ignores unknown values.
2. If you want to keep the telemetry export, deploy your own OpenTelemetry
   collector. The upgrade removes the bundled collector.
3. Set `global.otel.endpoint` to the URL of your collector.
4. If a workload in `protect` mode runs files through `/proc/<pid>/root`, set
   `ALLOW_FOREIGN_ROOT_EXEC` to `"1"` in the `options` of the container rules.
   Without this option, Runtime Enforcer blocks these executions.
5. Give your updated values file to Helm with the `-f` option:

   ```console
   helm upgrade runtime-enforcer kubewarden/runtime-enforcer \
     --namespace runtime-enforcer \
     -f values.yaml \
     --wait
   ```
6. Install the `kubectl runtime-enforcer` plugin from the same release. The
   plugin version must match the `appVersion` of the chart.

The
[upgrade path](https://docs.kubewarden.io/runtime-enforcer/0.11/en/reference/upgrade-path.html)
page lists every change between v0.10 and v0.11.

## Getting in touch

As always, you can contact us through
[Slack](https://kubernetes.slack.com/?redir=%2Fmessages%2Fkubewarden) and
[GitHub discussions](https://github.com/orgs/kubewarden/discussions).
