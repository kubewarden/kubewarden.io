---
title: Introducing Kubewarden WASI policies
authors:
  - Flavio Castelli
date: 2023-10-24
---

Kubewarden policies can be written using either a [traditional programming language](https://docs.kubewarden.io/writing-policies) (like Go, Rust, C#, Swift, &hellip;) or using a domain-specific language like [Rego](https://docs.kubewarden.io/writing-policies/rego/intro-rego).
It is required that the programming language can generate the necessary WebAssembly module for use by Kubewarden.

When using a traditional programming language, the communication between the
host executing the policy and the WebAssembly guest (the actual policy) uses the
[waPC](https://wapc.io/) communication protocol.
This protocol provides a bidirectional channel between the host and guest.
It allows us to expose extra capabilities to policies (like cryptographic signature verification via Sigstore and [more](https://docs.kubewarden.io/writing-policies/spec/host-capabilities/intro-host-capabilities)).
We can also grant read access to selected Kubernetes resources (see [context-aware policies](https://docs.kubewarden.io/explanations/context-aware-policies)).

The target language used to write the policy must provide a waPC guest driver.
Writing such a driver is a one-time job that is not complex.
For example, we've written the Swift and the C# drivers and found them to be straightforward.
However, there are special circumstances when writing this driver is not possible.
This is the case with WebAssembly modules produced by the official Go compiler (not to be confused with those produced by the TinyGo compiler).

## Go and server-side Wasm

The Go 1.21 compiler introduces support for WebAssembly modules that can be run on the server side.
Before this release, the official compiler was able to produce only WebAssembly modules that could be run by a web browser.
[TinyGo](https://tinygo.org/) does an excellent job of producing server side WebAssembly modules but there are still some complex Go codebases that cannot be compiled by it.

The Go 1.21 release introduces support for the [WebAssembly System Interface](https://wasi.dev/) (aka _"WASI"_)
with the new `GOOS` named [`wasip1`](https://tip.golang.org/doc/go1.21#wasip1).

Unfortunately, due to [this issue](https://github.com/golang/go/issues/42372), it's not yet
possible to use the waPC guest driver inside of WebAssembly modules built by the official
compiler.
This is where the new Kubewarden WASI policy type becomes useful.

## A new policy type

With the Kubewarden 1.7 release, a new type of policy has been introduced:
[`WASI`](https://docs.kubewarden.io/writing-policies/wasi)
policies.

To produce a Kubewarden WASI policy, the policy author writes a traditional CLI program.
The program will obtain the evaluation payload from `STDIN` and writes the evaluation response on `STDERR`.
This completely removes the dependency on waPC.

## A concrete example

Kubewarden aims to become the universal policy framework for Kubernetes.
We don't want to prescribe how policy authors should write their policies.
In contrast, we intend to provide a flexible way to express rules and constraints.

As part of this aim,
we wanted to support the [YAML-based DSL](https://kyverno.io/docs/writing-policies/) used by Kyverno to write policies.

Kyverno is written using Go, so we tried to compile its policy evaluation engine to WebAssembly.
However, its codebase is too complex for TinyGo, but not for the official Go compiler.

By using Go 1.21 and the new Kubewarden WASI policy type,
we have been able to implement [this](https://github.com/kubewarden/kyverno-dsl-policy) experimental policy allowing Kubewarden to reuse certain Kyverno policies.

## Summary

Starting with Kubewarden 1.7 policy authors can write policies using programming languages not yet supported by waPC or by Kubewarden SDKs.
The only requirement for these languages is to support the WASI compilation target.

Using WASI policies has [several limitations](https://docs.kubewarden.io/writing-policies/wasi#limitations), so should be done only under special circumstances.

Let us know what you think about this new policy type.
We are especially interested to know what you're building with it.

If you would like to write Kubarden policies using a programming language that we don't yet support,
please [reach out to us](https://kubernetes.slack.com/archives/kubewarden).
We would be happy to look at implementing this feature with you.
