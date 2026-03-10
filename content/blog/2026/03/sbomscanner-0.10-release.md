---
title: "SBOMscanner 0.10 Release"
authors:
  - Alessio Greggi
date: 2026-03-09
---

The Kubewarden ecosystem continues to expand its supply chain security capabilities!
Hot on the heels of the [Admission Controller 1.33 release](https://www.kubewarden.io/blog/2026/03/adm-controller-1.33-release/), we are excited to 
announce SBOMscanner `v0.10.0`. This release introduces powerful new features and 
critical stability fixes. Let’s dive in!

## Workload Scan

Until now, SBOMscanner required explicit `Registry` configurations to scan images. 
However, what usually matters most are the images actively running in your cluster.

The new Workload Scan feature automatically discovers and scans container images 
based on live workloads. 

It dynamically creates `Registry` resources for images and aggregates 
vulnerability findings into a `WorkloadReport`. This is a game-changer for 
registries with thousands of images where only a fraction are actually deployed on
the cluster, ensuring your security focus remains on your active attack surface.

For more details, take a deep look to the [doc](https://github.com/kubewarden/sbomscanner/blob/main/docs/user-guide/scanning-workloads.md).

## Index Digest Support

We've added support for **Index Digests** to better handle multi-architecture images. 
This allows users to query the API and resolve all architecture-specific images 
back to their parent digest, providing much better visibility into supply chain 
metadata for diverse hardware environments.

Here's how the user can retrieve all the images belonging to the same `indexDigest`:

```
kubectl get images --field-selector imageMetadata.indexDigest=sha256:9027c22b27e600e56eef6b35771629e9d14a7e9075170f516845d30b5776943d
NAME                                                               REFERENCE                                     PLATFORM
8bcd8a3c9fc325a379a739322ca54baded7eb9eb717be9a3764f5a4b0f1820fa   index.docker.io/cilium/cilium:v1.17.0-pre.2   linux/amd64
c49d5c94330d411e2f3db068e1990e30d60f5b1cd61f04873dcd3af50aa70cda   index.docker.io/cilium/cilium:v1.17.0-pre.2   linux/arm64
```

## Bug Fixes and Stability

Beyond the headline features, `v0.10.0` includes several "under the hood" fixes to 
improve the resilience of the scanning loop:

* *Resilience for VEX Hub cache expiration*: We identified and fixed an upstream 
issue in trivy where the cache was incorrectly purged after expiration, preventing 
the use of VEX Hub repositories. 
Our fix ensures the cache remains usable and avoids unnecessary full deletions.

* *Registry Security Configs*: Restored support for `insecure` and `caBundle` options. 
Previously, these were defined in the CRD but not passed to the trivy command, 
which caused issues for users scanning private registries with self-signed certificates.

* *NATS SecurityContext*: Corrected the *SecurityContext* in the NATS Helm chart 
dependency to resolve permission-related startup failures.

* *VulnerabilityReport Reconciliation*: Fixed a logic error where `CompletionTime` 
was being reset on every reconcile, which previously skewed scan duration metrics.

# Getting in touch

Join the conversation on
[Slack](https://kubernetes.slack.com/?redir=%2Fmessages%2Fkubewarden) or
[GitHub discussions](https://github.com/orgs/kubewarden/discussions) and let us
know how you’re finding SBOMscanner 0.10!
