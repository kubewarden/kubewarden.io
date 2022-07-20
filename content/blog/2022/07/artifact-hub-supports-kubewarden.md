---
title: Kubewarden policies, now on Artifact Hub!
authors:
- Flavio Castelli
date: 2022-07-22
---

Today we're happy to announce that [Artifact Hub](https://artifacthub.io/)
now supports Kubewarden policies! 🤯 🥳

Artifact Hub is the de-facto place where Cloud Native users search for
helm charts, container images, and other kinds of artifacts and configurations
of different CNCF projects. That's why we are super excited and honored to
have Kubewarden policies listed on Artifact Hub.

> This would not have been possible without the work done by the Artifact Hub team.
> They have been extremely helpful with us, thanks a lot folks! 🤗

Our mission at Kubewarden has always been to simplify the process of writing,
maintaining and **distributing** policies.

Kubewarden policies are distributed using traditional container registries.
This allows operators to manage Kubewarden policies using the same set of tools
and processes they are already familiar with.

Having a proven technology to physically distribute policies is just part of
the solution. It's also important to provide Kubernetes operators a way to
discover ready to use policies.
That's why we created [Kubewarden Policy Hub](https://hub.kubewarden.io).

While Kubewarden Policy Hub served this purpose well, it was always meant to be
a temporary solution. One of the goals on our roadmap was to integrate with and serve the
community of Artifact Hub.

This is why **we have moved all our policies to Artifact Hub**. You can view
them by [using the *"Kubewarden policies"* filter](https://artifacthub.io/packages/search?kind=13&sort=relevance&page=1)
on Artifact Hub.

We've also updated all our policy templates (the ones used
to quickly create Rust, Go, Swift, Gatekeeper, and Open Policy Agent policies)
to have all the files necessary to publish to Artifact Hub.

We will keep the Kubewarden Policy Hub running for some time so that all
our users are aware of this change. However we do plan to decommission it with adequate notice in the future.

## What does this mean for you?

If you are a Kubernetes operator, looking for a ready-to-use policy, you
can find it by using the familiar interface of Artifact Hub.

If you are a Kubewarden policy author, you can now share your policies on Artifact
Hub and reach a broader audience. Checkout our
[documentation](https://docs.kubewarden.io/distributing-policies/publish-policy-to-artifact-hub)
to learn how to do it.
