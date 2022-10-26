---
title: "Kubewarden 1.3 is out!"
authors:
- Flavio Castelli
date: 2022-10-26
---

The Kubewarden development team is happy to announce the release of the Kubewarden 1.3 stack.

In addition to the usual amount of small fixes, this release focused on the following
themes.

## Improve end users confidence

We want our users to feel confident about using Kubewarden, knowing that good
development and security practices are being followed by the Kubewarden project.
We think this is particularly relevant to Kubewarden, given our users trust us
to keep their Kubernetes clusters secure and compliant.

To achieve that, we've joined the [CLOMonitor](https://clomonitor.io/) initiative.
This is a project from the Clound Native Foundation which performs a series of
checks to ensure certain project health best practices are met.

We are proud to announce that Kubewarden is currently A-rated, with a score above
the 90%. The results are completely transparent and can be found by visiting
the [Kubewarden dashboard](https://clomonitor.io/projects/cncf/kubewarden)
on the CLOMonitor website.

## Performance improvements

We have reduced the startup time of Policy Server, the component in charge of
running all our WebAssembly policies.
The difference is quite significant when multiple policies are enforced by the
same `PolicyServer` Kubernetes resource.

To achieve that, we had to perform some refactoring of the internal architecture
of Policy Server. The good news is that this work paves the way for a feature
we will deliver shortly: being able to put a constraint on the evaluation
time of each policy.

Kubewardene policies can be developed using [Turing complete](https://en.wikipedia.org/wiki/Turing_completeness)
programming languages. This has benefits, but also drawbacks. Including the risk
of having a policy enter an endless loop.

The feature mentioned before is going to protect Kubewarden from this kind of
situations.

> **Tip:** do you know you can write Kubewarden policies using Rego, a non-turing
> complete language used also by Open Policy Agent and Gatekeeper?
>
> Kubewarden gives you the freedom to pick the right tool to implement your
> solutions.

## Better Sigstore integration

[Sigstore](https://sigstore.dev) is a project that is changing the way software
can be safely distributed.

We've seen the potential of Sigstore and we've embraced the project not just to
sign our own artifacts (binaries, container images and even policies), but also
to offer policies capable of
[verifying image signatures](https://artifacthub.io/packages/kubewarden/verify-image-signatures/verify-image-signatures).

Starting from the 1.3.0 release, Kubewarden can handle Sigstore signatures
produced using a PKCS11 tokens, like hardware security modules (HSM) and smart
cards.

This has been made possible by the work done by members of the Kubewarden team
inside of the official [Sigstore SDK for Rust](https://github.com/sigstore/sigstore-rs).

> **Info:** given all the Sigstore verification code happens on the host side,
> not inside of WebAssembly module, there's no need to update the
> [Verify Image Signatures](https://artifacthub.io/packages/kubewarden/verify-image-signatures/verify-image-signatures)
> policy to gain this functionality.

Talking about Sigstore integration, we've been proud consumers and
ambassadors of the keyless signing mechanism. We believe this functionality
provides a secure way to sign and verify artifacts, even inside of CI/CD
pipelines, without the hassle of maintaining a public key infrastructure.

We're happy to learn that keyless signing is now considered stable by
Sigstore community after the
recent announcement of [Rekor and Fulcio being General Available](https://blog.sigstore.dev/sigstore-ga-ddd6ba67894d).

## Policy improvements

We have recently created some new Kubewarden policies. All of them are
already available on [ArtifactHub](https://artifacthub.io).

So far we've published a [blog post](/blog/2022/10/env-var-secrets/)
dedicated to the
[environment variable secret scanner](https://artifacthub.io/packages/kubewarden/env-variable-secrets-scanner/env-variable-secrets-scanner)
policy.
In next weeks we will publish other posts dedicated to the
[volumeMount](https://artifacthub.io/packages/kubewarden/volumemounts-policy/volumemounts)
and to the
[environment variable compliance](https://artifacthub.io/packages/kubewarden/environment-variable-policy/environment-variable-policy)
policies.

We've also updated some of the existing policies that used to target only `Pod`
resources. These policies have been extended to be able to analyze also
other higher level Kubernetes resources like `Deployment`, `ReplicaSet`,
`DaemonSet`, `ReplicationController`, `Job` and `CronJob`.

This allows the Kubernetes administrators to decide at which level the policy
is going to operate:

* Target Pod: different kind of resources (be them native or CRDs) can create Pod
  objects. By having the policy target Pods, we guarantee that all the Pods are going
  to be compliant, even those created by CRDs.
  However, this could lead to confusion among users of the cluster,
  as high level Kubernetes resources would be successfully created, but would
  stay in a non reconciled state.
  For example: a Deployment defining a non compliant Pod would be accepted
  into the cluster, but it would never have all its replicas running because
  the policy would prevent the creation of its Pods.
* Target higher level resources (e.g: Deployment): users of the cluster 
  will get immediate feedback about rejections. However, non compliant pods
  created by other higher level resources (be it native to Kubernetes,
  or CRDs), would not get rejected. For example, a Policy targeting only
  Deployment objects would not prevent the creation of non compliant Pods
  spawned by a DaemonSet.

There's no right or wrong approach, it's even possible to use both of them
at the same time (target Pods plus some higher level resource). What
matters is that Kubernetes administrators have full control of this detail.

## What's next

We're already actively working on what is going to become our next release.

In the meantime, try out the freshly backed 1.3.0 release and feel free
to
[reach out to us](https://kubernetes.slack.com/?redir=%2Fmessages%2Fkubewarden)
to share your feedback!
