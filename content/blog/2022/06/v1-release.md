---
title: Kubewarden reaches 1.0.0 release 🎉
authors:
- Flavio Castelli
date: 2022-06-22
---

Kubewarden is a policy engine for Kubernetes that is part of CNCF Sandbox.

Never heard of Kubewarden before? Do you want to know what makes Kubewarden
stand out among similar solutions?
This is a high level overview of Kubewarden's unique points:

* Boost Policy Authors' productivity: write policies using your favorite
  programming language. Leverage your knowledge, skills and tools.
* Policies are portable WebAssembly modules
* Reuse your existing Open Policy Agent / Gatekeeper policies
* Distribute policies using regular container registries
* Secure supply chain, leverage Sigstore to sign and verify policies

Today, a year and a half since its conception, we're thrilled to announce
the release of Kubewarden v1.0.0! 🎊 🥳

Let's take a quick look at the major achievements of the project to see what `v1`
brings both to Policy Authors and Operators.

## Writing policies

Kubewarden v1 allows Policy Authors to write policies using either Go, Rust, or Swift.
Each language features a rich SDK that simplifies the process of validating and
mutating Kubernetes admission requests.

Creating a new policy can be done quickly by scaffolding one of our official
policy templates projects. New policies created in this way will feature best
practices such as: code linters, unit tests, end to end tests, policy signing
and publishing. All of that is automated using GitHub Actions.

When writing code, being able to pick the right tool for the job is important.
That's why Kubewarden, on top of the programming languages mentioned above,
also supports the Rego query language.
Due to this Kubewarden can execute Open Policy Agent and Gatekeeper
policies without any change.
This is great both for Policy Authors who prefer Rego and for Operators who can
reuse the policies they have previously created or that they discover online.

## Pod Security Policy replacement

[Kubernetes Pod Security Policies](https://kubernetes.io/docs/concepts/security/pod-security-policy/)
have been deprecated starting from Kubernetes 1.21 and
are going to be removed in the upcoming 1.25 release.

Some of the scenarios covered by Pod Security Policies can be reimplemented
using the new built-in PodSecurity Admission Controller. However, not all the
Pod Security Policies can be replaced in that way.

Luckily, the Kubewarden [Policy Hub](https://hub.kubewarden.io/) features
ready to use Kubewarden policies that replace each one of the former Pod
Security Policies.

Checkout [our documentation](https://docs.kubewarden.io/tasksDir/psp-migration)
for more details about the migration process.

> **Note:** keyless signing is still considered experimental by the Sigstore
> project. The Kubewarden 1.0.0 release is not able to handle keyless signatures
> created from May 2022 onward.
>
> This regression has been introduced by a recent change done by the Sigstore
> project. This issue is going to be fixed with the next release of the
> Kubewarden stack.
>
> In the meantime, regular key based signatures can be used.

## Observability

All the Kubewarden stack components have [OpenTelemetry](https://opentelemetry.io/)
integration in place. This is used to emit trace events and expose monitoring data.

Thanks to that, policy metrics can be scraped by [Prometheus](https://prometheus.io/)
and then shown inside of [Grafana](https://grafana.com/) dashboards, like
[this one](https://grafana.com/grafana/dashboards/15314)
provided by the Kubewarden team.

Finally, Policy Authors can emit OpenTelemetry trace events straight from the policies.
This functionality, like many others, is exposed by Kubewarden's SDKs.
These trace events can then be collected and processed by OpenTelemetry. Finally
the events can be inspected using tools like [Jaeger](https://www.jaegertracing.io/).

This allows both Policy Authors and Operators to have a consistent observability
stack both for Cloud Native applications and Kubernetes policies.

## Software Secure Supply Chains

The topic of [Software Secure Supply Chains](https://www.nist.gov/itl/executive-order-14028-improving-nations-cybersecurity/software-security-supply-chains)
has been gaining momentum during 2021 and has become a high priority topic for
many organizations.

Kubewarden wants to help Operators to address the challenges posed by Secure
Supply Chains initiatives.

To do that, Kubewarden leverages the [Sigstore](https://www.sigstore.dev/)
project to implement software signing and verification.
All the components of the Kubewarden stack are signed using Sigstore. This also includes
all the Kubewarden policies maintained by the Kubewarden team.

Policy Authors can leverage Sigstore as a solution to sign and verify their
own policies too. Finally, Operators can utilize the tight integration of Sigstore
inside of our Policy Server to ensure only trusted policies are deployed on their
Kubernetes clusters.

Sigstore verification primitives are available to Policy Authors via our official
SDKs. They make it possible to write custom policies performing signature verification
against any kind of object stored inside of an OCI registry.
The Kubewarden team also offers a ready to use
[Kubewarden policy](https://github.com/kubewarden/verify-image-signatures)
that ensures only trusted container images can run inside of a Kubernetes cluster.

## What's coming next

WebAssembly adoption is blooming. Many programming languages are now targeting
WebAssembly or have improved their pre-existing support of it. That means we
will be able to offer more alternatives to our Policy Authors in the future.
If you are a Policy Author and would like to write policies
using a language that is not yet supported by Kubewarden, please reach out to us and
tell us your story!

We also plan to improve our reporting capabilities and introduce the ability
to generate compliance audit checks about the status of your Kubernetes
cluster.

We want to improve our Secure Supply Chain story. We are already in the process
of creating Software Bill Of Materials (SBOMs) for the different components
of our stack.

These are just some of the topics we want to address. Don't forget that
Kubewarden is developed in the open. You can checkout our GitHub project boards
to know more about what is happening and what we have planned.
[This project board](https://github.com/orgs/kubewarden/projects/1) covers day-to-day
activities, while [this other one](https://github.com/orgs/kubewarden/projects/2)
provides a higher level overview about our roadmap.
