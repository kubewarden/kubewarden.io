---
title: "The Year in Review: Kubewarden's Progress in 2024"
authors:
  - Martin Kravec
  - John Krug
  - José Guilherme Vanz
date: 2024-12-19
---

It was an exciting year for Kubewarden policy management. We had new features,
performance improvements, and have been working towards a regular release
schedule.

The year has seen work in these areas:

- performance and reliability 
- scalability improvements to reduce complexity and improve security 
- adding CEL policies and policy grouping using logical operators 
- improving community outreach

Kubewarden
[1.10](https://www.kubewarden.io/blog/2024/01/kubewarden-1-10-release/) had
optimizations for policy server performance. Memory usage was improved,
enabling constant consumption even in large deployments. Policy evaluation now
operates on-demand, consuming resources only as needed.

Policy authors can now create context-aware WASI policies with Kubernetes
resource insights. This expands Kubewarden’s flexibility policies to use
Kubernetes capabilities.

Kubewarden
[1.11](https://www.kubewarden.io/blog/2024/03/kubewarden-1-11-release/) brought
audit scanner improvements. These included parallelized operations, reduced
resource consumption, and improved efficiency. Furthermore, new host
capabilities allowed policies to [retrieve OCI image
manifests](https://www.kubewarden.io/blog/2024/03/oci-manifest-capability/),
helping developers enforce security standards by inspecting container
configurations in detail.

Releases
[1.12](https://www.kubewarden.io/blog/2024/04/kubewarden-1-12-release/) and
[1.13](https://www.kubewarden.io/blog/2024/06/kubewarden-1-13-release/) were
about high availability and resource management. Policy Server deployments now
have support for `PodDisruptionBudgets`, affinity rules, and resource limits.
This improves stability in production environments. Gatekeeper policies saw a
55% performance boost. Memory usage was reduced for clusters managing thousands
of resources.

The introduction of [CEL
policies](https://www.kubewarden.io/blog/2024/06/welcome-cel-policy/) in
release
[1.14](https://www.kubewarden.io/blog/2024/06/kubewarden-1-14-release/),
enabled the use of the [Common Expression Language](https://cel.dev/) for
policies. This is a drop-in replacement with Kubernetes'
[`ValidatingAdmissionPolicies`](https://kubernetes.io/docs/reference/access-authn-authz/validating-admission-policy/).

The [Policy Groups
feature](https://www.kubewarden.io/blog/2024/10/policy-groups/) in release
[1.17](https://www.kubewarden.io/blog/2024/10/kubewarden-1-17-release/), allows
users to combine multiple policies using logical expressions. This reduces
complexity while enabling advanced validations, like ensuring unique Kubernetes
service selectors or enforcing organizational rules. This lets users create
powerful, maintainable, and reusable policies more easily.

Release 1.17 also brought automated certificate generation and rotation,
removing the dependency on [cert-manager](https://cert-manager.io/). This more
self-sufficient approach improved the management of TLS certificates,
simplifying operations and enhancing security. The
[1.18](https://www.kubewarden.io/blog/2024/11/kubewarden-1-18-release-slsa-level-3/)
release contains [SLSA Level 3](https://slsa.dev/spec/v1.0/levels#build-l3)
compliance, an important milestone in our improved supply chain security.

By the end of the year, we released
[1.20](https://www.kubewarden.io/blog/2024/12/kubewarden-1-20-release/), which
brought new [OpenTelemetry](https://opentelemetry.io/) scenarios. This release
expands on how Kubewarden can be integrated with OpenTelemetry collectors,
allowing users to configure the whole stack to send telemetry data to their own
collectors, managed by their organization.

As well as the technical achievements, we tried to strengthen the Kubewarden
community. A new [community](https://github.com/kubewarden/community)
repository consolidates documentation, guidelines, and contributor resources.
This eases engagement for new or experienced contributors.

Kubewarden also grew its policy library, also refining existing policies like
[verify-image-signatures](https://github.com/kubewarden/verify-image-signatures)
and [trusted-repos](https://github.com/kubewarden/trusted-repos-policy) to
support all Kubernetes workloads. Beyond that, We also had a presence at
KubeCon and KCD Italy.

Kubewarden is ready for 2025. We plan to extend the capabilities of Policy
Groups, refine certificate management, and introduce developer tools for
automation and testing.

Thank you to our community for making 2024 a productive year. Let’s continue
improving admission policy management. Join us on Slack or in our community
meetings.

Happy policy writing!
