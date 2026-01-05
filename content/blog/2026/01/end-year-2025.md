---
title: "The year in review: Kubewarden's progress in 2025"
authors:
  - Víctor Cuadrado Juan
date: 2026-01-05
---

Join us in celebrating a fruitful 2025 for the Kubewarden project!

The team has spent time planting kernels and enjoying the fruit of
the grown ideas. Let's look together at what the basket brings as we say ciao to 2025.
Grab anything you like for the trip!

## Expanding the Scope: Introducing SBOMScanner

2025 saw Kubewarden expand beyond admission policies with the introduction of
[**SBOMScanner**](https://www.kubewarden.io/blog/2025/11/expanding-kubewarden-scope/),
a new project donated to CNCF under the Kubewarden umbrella.

SBOMscanner is an image scanner that integrates seamlessly with Kubernetes. It
uses Kubernetes concepts like Custom Resource Definitions and uses advanced
Kubernetes features such as the [API Aggregation
Layer](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/apiserver-aggregation/)
for performance and scalability.

SBOMscanner is built around the concept of Software Bill of Materials (SBOM).
Images are downloaded once, their SBOMs are created, and then, at regular
intervals, they are scanned for vulnerabilities. This approach reduces the time
and resources required to keep the ever-growing list of container images
scanned.

## Expanding the policy ecosystem

Motivated by the community, we made the decision to declare the majority of
policies as stable with a `v1.0.0` release. A bunch of policies had major UX
updates, such as `trusted-repos` and `environment-variables`.

Our policy library grew significantly in 2025. We launched over [70 new Rego
policies](https://github.com/kubewarden/rego-policies-library) for security,
compliance, RBAC, network, and Flux.

In addition, we added more policies prompted by our community:
[High-Risk Service Account
Blocker](https://github.com/kubewarden/high-risk-service-account-policy),
[Priority Class policy](https://github.com/kubewarden/priority-class-policy),
[Probes policy](https://github.com/kubewarden/probes-policy), [Labels
policy](https://github.com/kubewarden/labels-policy), [Annotations
policy](https://github.com/kubewarden/annotations-policy), [Environment
Variables policy
v3](https://github.com/kubewarden/environment-variable-policy), [Trusted
Repos policy v2](https://github.com/kubewarden/trusted-repos-policy), [Image
CVE policy](https://github.com/kubewarden/image-cve-policy) (works with
SBOMScanner), [IngressNightmare
policy](https://github.com/hierynomus/ingressnightmare-policy),
[Do-Not-Expose-Admission-Controller-Webhook-Services
policy](https://github.com/kubewarden/do-not-expose-admission-controller-webhook-services-policy),
and others.

As usual, all our policies are available in [artifacthub.io](https://artifacthub.io/packages/search?kind=13&sort=relevance&page=1).

## JavaScript/TypeScript SDK joins the family

2025 marked a milestone with the release of the [JavaScript/TypeScript
SDK](https://www.kubewarden.io/blog/2025/11/policy-sdk-js), thanks to a
successful Google Summer of Code project from Esosa Ohangbon. Policy developers
can now write policies in the world’s most popular language, using a fully
typed SDK and a ready-to-use policy template. This opens Kubewarden to a
broader audience and fosters new contributions.

## An eye on Usability and Scale

Our CLI tool, `kwctl`, saw major improvements: support for running
policies and policy groups from YAML, custom rejection messages, and local
evaluation mirroring in-cluster behavior.

Helm charts gained air-gap install support via Hauler manifests, and small
tidbits to simplify deployments at scale. Our Audit Scanner now supports both
legacy PolicyReports and new OpenReports CRDs.

Our stack now supports mTLS for webhook servers, full Pod Security Admission
restricted profile compliance, and granular per-policy evaluation timeouts.
These features empower operators to deploy Kubewarden at scale with confidence.

As usual, we continuously paid our technical debt, laboring and tilling. We took
care of our dependencies, automations, overall architecture, and documentation 
to ensure we have a reliable and secure project.

## Community and Collaboration

Kubewarden’s presence grew at events like KubeCon EU and ContainerDays Hamburg,
with talks, kiosks, and webinars showcasing our work. The project joined the
OpenReports initiative, helping standardize policy reporting across the CNCF
ecosystem.

Our contributors actively participated in the Kubernetes Policy Working Group,
collaborated with upstream projects, and welcomed new maintainers and community
members. The launch of the SBOMscanner project under the Kubewarden umbrella
demonstrates our commitment to holistic Kubernetes security.

## To future harvests

As we close out 2025, we feel we stand stronger than ever, backed by a
energetic community, a growing ecosystem of policies, and a commitment to open
source values. We thank every contributor, adopter, and user for their support
and feedback.

We look forward to our 2026 plans for the project and for Kubewarden to
continue standing out as a uniquely comprehensive and thoughtfully designed
Kubernetes security framework.

Here’s to another year of innovation, collaboration, and making Kubernetes
safer and more flexible for everyone!

# Getting in touch

Join the conversation on
[Slack](https://kubernetes.slack.com/?redir=%2Fmessages%2Fkubewarden) or
[GitHub discussions](https://github.com/orgs/kubewarden/discussions) and let us
know how you found 2025!
