---
title: "Expanding Kubewarden Scope"
authors:
  - Flavio Castelli
date: 2025-11-11
---

The Kubewarden project was created four years ago at SUSE with the goal of redefining Policy As Code. We built a universal policy engine for Kubernetes and donated it to the CNCF.

When the project started, policies could only be written in Rust and Go. Since then, we've worked to increase flexibility. Today, policies can also be written in other programming languages such as C#, and even JavaScript and TypeScript (stay tuned for the upcoming announcement).

It's also possible to use DSLs like [Rego](https://docs.kubewarden.io/tutorials/writing-policies/rego/intro-rego), and seamlessly [lift and shift](https://docs.kubewarden.io/howtos/gatekeeper-migration) Gatekeeper and Open Policy Agent policies to Kubewarden. The same applies to [CEL](https://docs.kubewarden.io/tutorials/writing-policies/CEL/intro-cel), with the ability to reuse Kubernetes Validating Admission Policies without modification. We even have an [experimental way](https://github.com/kubewarden/kyverno-dsl-policy) to write policies using Kyverno's syntax.

Supporting different languages isn't our only goal. We're also focused on [performance and scalability](https://docs.kubewarden.io/howtos/deploy-at-scale) in collaboration with our community. Our [Raw policies](https://docs.kubewarden.io/howtos/raw-policies) make it possible to use our Policy Server to validate any kind of JSON object, even outside Kubernetes.

We continue to expand the list of [host capabilities](https://docs.kubewarden.io/reference/spec/host-capabilities/intro-host-capabilities) available to policy authors, adapting to the constantly changing requirements for securing cloud native systems.

Kubewarden has gone from strength to strength and today I'm excited to announce something new. The Kubewarden project is expanding its scope, looking beyond admission policies.

# Announcing SBOMscanner

As mentioned earlier, the requirement to keep cloud native environments secure is constantly growing. A critical aspect is keeping track of vulnerabilities affecting the workloads running inside Kubernetes clusters.

We take this challenge seriously and have found a solution. Today SUSE is making another donation to CNCF, contributing a new project under the Kubewarden umbrella.

> **Meet [SBOMscanner](https://github.com/kubewarden/sbomscanner):**  
> A SBOM security scanner for Kubernetes that helps teams proactively monitor and manage vulnerabilities in their workloads, improving cluster security and compliance.

# What makes SBOMscanner different

SBOMscanner is an image scanner that integrates seamlessly with Kubernetes. It uses Kubernetes concepts like Custom Resource Definitions and uses advanced Kubernetes features such as the [API Aggregation Layer](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/apiserver-aggregation/) for performance and scalability.

As the name suggests, SBOMscanner is built around the concept of Software Bill of Materials (SBOM). Images are downloaded once, their SBOMs are created, and then, at regular intervals, they are scanned for vulnerabilities. This approach reduces the time and resources required to keep the ever-growing list of container images scanned.

Currently, SBOMscanner relies on [trivy](https://github.com/aquasecurity/trivy) to scan container images. However, it's designed to support multiple vulnerability scanners. Building SBOMscanner wouldn't have been possible without trivy, as well as CNCF projects like [NATS](https://nats.io/) and [CloudNativePG](https://cloudnative-pg.io/).

# Trying SBOMscanner

SBOMscanner is not yet production-ready, but it's already capable of delivering value, especially when used with Kubewarden. We've created [this policy](https://github.com/kubewarden/image-cve-policy) that allows you to prevent the usage of vulnerable container images inside your Kubernetes cluster.

The same policy, used in conjunction with Kubewarden's [Audit Scanner](https://docs.kubewarden.io/explanations/audit-scanner/policy-reports), can be used to create compliance reports for your cluster, allowing administrators to identify all vulnerable workloads running inside the cluster.

Read [these instructions](https://github.com/kubewarden/sbomscanner/blob/v0.8.1/docs/installation/quickstart.md) to learn how to deploy SBOMscanner.

> Note: The link points to the latest release. We plan to move all these documents to the official Kubewarden documentation.

## Getting in touch

We'd love to hear your feedback about SBOMscanner. Your input helps us prioritize the work required to make it production-ready.

You can get in touch with us on [Slack](https://kubernetes.slack.com/?redir=%2Fmessages%2Fkubewarden) or [GitHub discussions](https://github.com/orgs/kubewarden/discussions).

Try SBOMscanner today and let us know what you think!
