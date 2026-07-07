---
title: "SBOMscanner 0.12 Release: Full-Stack Security with Node Scanning"
authors:
  - Alessio Greggi
date: 2026-07-07
---

We are thrilled to announce the release of SBOMscanner
[`v0.12.0`](https://github.com/kubewarden/sbomscanner/releases/tag/v0.12.0)!
With this version, SBOMscanner takes a big step forward in its mission to
provide a complete, SBOM-based security picture of your Kubernetes clusters.
The highlight of this release is the brand new
[**Node Scan**](https://docs.kubewarden.io/sbom-scanner/0.12.0/en/user-guide/scanning-nodes.html)
feature, which extends visibility from container images all the way down to
the nodes that run them.

## Why scan nodes?

Until now, SBOMscanner focused on what runs *inside* your cluster: container
images pulled from your registries and, more recently, the workloads actually
deployed on the cluster. That is a big part of the story, but it is not the
whole story.

Nodes are the foundation of every Kubernetes cluster. They run the operating
system, the kernel, the container runtime, the kubelet, and a whole set of
system-level packages that never appear in any container image. If a critical
CVE is disclosed for one of those components, no amount of image scanning
will surface it. That blind spot is exactly what Node Scan is here to close.

With SBOMscanner `v0.12.0`, you can now get a **full-stack security overview**
of your cluster, from the base operating system on each node up to every
container image running on top of it.

## Introducing Node Scan

Node Scan is delivered the Kubernetes-native way: through Custom Resource
Definitions. You describe *what* you want to happen with a small set of CRDs,
and SBOMscanner takes care of the rest, scheduling scans, running them on
every eligible node, and producing SBOMs and vulnerability reports that you
can query with `kubectl`.

The new CRDs introduced in this release are:

* **`NodeScanConfiguration`**: a cluster-scoped, singleton resource that acts
  as the single entry point to control node scanning globally.
* **`NodeScanJob`**: represents a single scan execution against a specific
  node, either scheduled automatically or created on demand.
* **`NodeSBOM`**: the Software Bill of Materials for a node, in SPDX format.
* **`NodeVulnerabilityReport`**: the vulnerability analysis results produced
  from a `NodeSBOM`.

## Getting started

Node scanning becomes active as soon as you apply a `NodeScanConfiguration`
resource. Here is a minimal example that scans every eligible node every 5
minutes:

```yaml
apiVersion: sbomscanner.kubewarden.io/v1alpha1
kind: NodeScanConfiguration
metadata:
  name: default
spec:
  scanInterval: 24h
```

That is really all it takes to get started. Apply it with `kubectl apply -f`
and SBOMscanner will start producing `NodeSBOM` and `NodeVulnerabilityReport`
resources for you.

### Tuning what gets scanned

Real clusters are rarely uniform, so `NodeScanConfiguration` gives you a few
knobs to focus the scan where it matters:

* **`scanInterval`**: how often the scan runs automatically.
* **`nodeSelector`**: a standard Kubernetes label selector that limits
  scanning to a subset of nodes. Useful for skipping nodes that don't have
  enough resources or for targeting a specific node pool.
* **`platforms`**: restrict scanning to specific OS/architecture
  combinations, handy on mixed-architecture clusters.
* **`skipPatterns`**: gitignore-style patterns for files and directories to
  exclude from the scan. By default, SBOMscanner already skips the container
  runtime state directories (`/var/lib/containerd/`, `/var/lib/docker/`, and
  friends) so that image content already covered by registry scanning is
  not scanned twice as raw files on disk.

Here is a more complete example combining all of these:

```yaml
apiVersion: sbomscanner.kubewarden.io/v1alpha1
kind: NodeScanConfiguration
metadata:
  name: default
spec:
  scanInterval: 1h
  nodeSelector:
    matchLabels:
      node-role.kubernetes.io/worker: ""
  platforms:
    - arch: "amd64"
      os: "linux"
    - arch: "arm64"
      os: "linux"
  skipPatterns:
    - "/tmp/"
    - ".git/"
    - "node_modules/"
    - "*.min.js"
```

### Running a scan on demand

You don't always want to wait for the next scheduled scan. There are two ways
to trigger one immediately.

The first is to annotate the `NodeScanConfiguration` — SBOMscanner will
schedule a fresh scan for every matching node and then remove the annotation
automatically:

```bash
kubectl annotate nodescanconfiguration default \
  sbomscanner.kubewarden.io/node-rescan-requested=true
```

The second is to create a `NodeScanJob` yourself for a single node:

```yaml
apiVersion: sbomscanner.kubewarden.io/v1alpha1
kind: NodeScanJob
metadata:
  name: scan-worker-1
spec:
  nodeName: worker-1
```

## Checking the results

Once scans start running, everything is available through the Kubernetes API,
so you can use your usual `kubectl` workflows.

Follow the status of the scan jobs:

```bash
kubectl get nodescanjobs
```

```text
NAME              STATUS       REASON       AGE
scan-worker-1     Complete     Complete     5m
scan-worker-2     InProgress   InProgress   1m
```

List the produced SBOMs and vulnerability reports:

```bash
kubectl get nodesboms
kubectl get nodevulnerabilityreports
```

You can also slice the results by node or by platform using field selectors —
very handy for large clusters:

```bash
kubectl get nodesboms --field-selector='nodeMetadata.name=worker-1'
kubectl get nodevulnerabilityreports --field-selector='nodeMetadata.platform=linux/amd64'
```

And of course, the full report is just a `kubectl get -o yaml` away:

```bash
kubectl get nodevulnerabilityreport worker-1 -o yaml
```

## The bigger picture

With Node Scan, SBOMscanner now covers the three layers that make up your
cluster's runtime attack surface:

* **Registries**: the images you *could* run.
* **Workloads**: the images you *are* running.
* **Nodes**: the infrastructure they are running *on*.

That combination gives platform and security teams a single, consistent,
Kubernetes-native view of vulnerabilities across the whole stack. Combined
with the Kubewarden [image-cve-policy](https://github.com/kubewarden/image-cve-policy),
you can turn this visibility into enforcement, blocking vulnerable workloads
at admission time and producing compliance reports for what is already
running.

## Getting in touch

Give SBOMscanner `v0.12.0` a spin and let us know what you think — feedback
from real clusters is what drives the roadmap.

Join the conversation on
[Slack](https://kubernetes.slack.com/?redir=%2Fmessages%2Fkubewarden) or
[GitHub discussions](https://github.com/orgs/kubewarden/discussions) and
share how Node Scan fits into your security workflow!
