---
title: Kubewarden 1.7.0 release
authors:
  - Flavio Castelli
date: 2023-09-21
---

Today we are delighted to announce the release of Kubewarden 1.7.0! 🎊 🥳
Aside from the bug and stability fixes, this release is packed with new features.
This post highlights the main changes, detailed blog entries will come in the next weeks covering each feature in depth.

## Audit scanner

A new component has been added to the Kubewarden stack. Its name is `audit-scanner` and
it allows administrators to assess the compliance level of the clusters secured by Kubewarden.

At regular intervals, or on demand, the audit scanner inspects all the resources defined inside your Kubernetes cluster.
It identifies those not compliant with the policies that are currently enforced.

Why is this useful? The number, types and configurations of the policies enforced on a cluster
vary over its lifetime.
A resource that was considered compliant recently may no longer be, since the introduction of a new policy.

The audit scanner writes its findings using two new types of Kubernetes Custom Resources:
`PolicyReport` and `ClusterPolicyReport`. Each Kubernetes Namespace inspected by the audit scanner
will feature one `PolicyReport` object that contains the results of the audit.
For cluster-wide resources (like Namespace, PersistentVolume, &hellip;), the audit scanner
creates one `ClusterPolicyReport` object per cluster.

We will publish a dedicated blog post about this new feature. In the meantime, you
can learn more about it by reading [this section](https://docs.kubewarden.io/explanations/audit-scanner).

## New Policy Type

Kubewarden policies can be written using either a [traditional programming language](https://docs.kubewarden.io/writing-policies) (like Go, Rust, C#, Swift, &hellip;) or using a domain-specific language like [Rego](https://docs.kubewarden.io/writing-policies/rego/intro-rego).
It is required that the programming language can generate the necessary WebAssembly module for use by Kubewarden.

When writing Go policies, the only viable way to produce a WebAssembly module has been by using the
[TinyGo](https://tinygo.org/) compiler. That's because, until recently, the official Go compiler
was only capable of producing WebAssembly modules that could be run by a web browser.

TinyGo does an excellent job at compiling Go code into small WebAssembly modules that can also be run outside of browsers.
However, it fails at compiling complex Go codebases. This isn't usually a problem for the average Kubewarden policy,
but we had something in mind that exceeded TinyGo's capabilities.

Last month (Aug 2023) Go 1.21 was released. With this release, the official Go compiler can
target also the [WebAssembly System Interface](https://wasi.dev/) (aka _"WASI"_).
This means it's now possible to create WebAssembly modules that can be evaluated outside of a browser.

The Go WASI support is pretty good, but there's still [one limitation](https://github.com/golang/go/issues/42372)
that prevents the creation of regular Kubewarden policies.
To circumvent this limitation, and be able to leverage the official Go compiler, we defined a type of Kubewarden policy that we
called _"vanilla WASI"_.

This new type of policy should be used only in special circumstances because it has its own set of limitations.
You can read more about this type of policy inside of [our docs](https://docs.kubewarden.io/writing-policies/wasi).
A detailed blog post about this new type of policy will be published in the next weeks.

## Experiment: reuse Kyverno DSL

It's clear from the previous section, we have been playing with the WASI support
introduced by the Go 1.21 release. We did this to create a Kubewarden policy capable of interpreting the Kyverno DSL,
this required the full power of the official Go compiler.

You can find this policy [here](https://github.com/kubewarden/kyverno-dsl-policy). The code is in its early days,
but it's already able to reuse certain types of Kyverno policies.

The policy is highly experimental and has limitations.
We would like to know what the community thinks about this idea. Should we keep
pushing this concept forward, are you interested in reusing the Kyverno DSL?

## Go policies improvements

Returning to the regular Kubewarden policies written in Go and compiled using TinyGo, we have
good news for policy authors.

The latest release of TinyGo (v0.29.0 published in August too), provides some great enhancements. The biggest one
is the support of the [`reflection`](https://pkg.go.dev/reflect) module. Thanks to this change it's
now possible to use the "[`encoding/json`](https://pkg.go.dev/encoding/json)" module.

Before this change policy authors had to resort to using the [`easyjson`](https://github.com/mailru/easyjson/)
library to handle marshalling and unmarshalling. It worked but the developer experience wasn't ideal with this workaround.

Thanks to the TinyGo improvements we have been able to remove the dependency against the `easyjson`
library from all our Go policies, the official SDKs and the template policy. We think this change hugely simplifies the
process of writing Go policies.

## Summary

In terms of improvements, the Kubewarden 1.7.0 release is probably one of the biggest releases we have done.
I would like to thank all the people involved in the process! ❤️

During the next weeks, we will publish in-depth articles about these improvements.
There are still some interesting tidbits left 😉

As usual, we are eager to hear from you how Kubewarden is helping you and how we can improve it.
You can reach out to us on [Slack](https://kubernetes.slack.com/?redir=%2Fmessages%2Fkubewarden)
and join us during our [monthly community meeting]({{<ref "/#get-in-touch">}}) on Zoom.
