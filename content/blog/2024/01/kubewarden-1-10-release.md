---
title: Kubewarden 1.10 release
authors:
  - Víctor Cuadrado
date: 2024-01-26
---

We have the first release of 2024, Kubewarden 1.10.0! 🎉🥳

And this one contains a nice bag of goodies, let's have a look!

## Reduced memory usage and increased reliability of Policy servers

A nice graph is worth a thousand words!

{{<figure src="/images/policy-server-optimization-1.10.png" alt="graph of the policy-server memory optimization"  >}}

Note the slightly lower memory consumption, and unchanging consumption when
scaling horizontally.

This graph represents the memory consumption of one instance of policy-server,
containing 13 policies:

- 4 instances of "verify-signatures"
- 5 of "pod-privileged"
- 2 of "go-wasi-template" (a 20MB policy, WASI being experimental)
- 1 Rego policy
- 1 ordinary Rust policy

The policy-server was configured with one worker to start, progressing to eight. For each worker
value, 10 samplings were taken.

#### Constant memory consumption when scaling horizontally

Before, we needed one instance of the policy evaluator (hence the Wasmstime stack)
for each policy deployed.

Now, memory consumption is constant no matter how many parallel policy
evaluators are spawned when scaling horizontally, by increasing the number of
threads available in the machine. This is achieved by only creating an instance
of the policy evaluator per unique type of policy module.

For example, if a user has the apparmor policy deployed 5 times (with different
names, settings, etc), now only one instance of policy evaluator will be
allocated for all of those 5 deployments.

In addition, we rely now on Wasmtime's pre-initialization of Wasm modules. This
allows us to keep a deduplicated list of all the policies in use, in their
pre-initialized form. This list is shared between all policy evaluators in the
policy-server.

#### Protection against policy memory leaks, and clean slate per policy

Before, there were long-running policy evaluators, ready to process policy requests.

Now, policy evaluation mode happens on-demand: we receive a request, a fresh
policy evaluator is created, used just for evaluating that request, and
discarded.

This is possible as we now leverage Wasmtime's pre-initialization, hence
creation time of policy evaluators is greatly reduced.

Using this on-demand approach to policy evaluators brings two main advantages:

- Impact of policies leaking memory is now virtually non-existent.
- Each evaluation starts with a clean slate, preventing bugs caused by policies
  leaving unclean state between evaluations.

#### Codebase simplification and increased test coverage

Also, thanks to a big refactor, together with additional unit and integration
tests, the policy-server codebase has moved away from using a worker thread
pool for policy evaluation to an asynchronous approach, removing codebase complexity.

Stay tuned for more performance improvements!

## WASI policies written in Go can now be context aware

Due to recent improvements in the official Go compiler, we have added
context-aware capabilities, via WASI, to the Kubewarden Go SDK, so it is
now possible to write context-aware Go WASI policies.

No divergence is needed when writing context-aware policies in WASI. Just use the Go SDK as usual,
making use of its `capabilities` package (which exposes querying for kubernetes
resources, OCI manifest digest, Sigstore signature verification, etc).

As an example, have a look at the
[go-wasi-context-aware-test-policy](https://github.com/kubewarden/go-wasi-context-aware-test-policy).

## Controller changes

The controller now reconciles divergences between `ClusterAdmissionPolicies`
and `AdmissionPolicies` and their associated webhook objects. This helps mitigate
against attacks that delete or modify policy webhooks, preventing policies from working correctly. RBAC rights already mitigate against these attacks.

## Audit Scanner changes

Thanks to the community contributions from Nuno Nelas and Bruno René Santos, the
Audit Scanner can now be run with an in-memory store
for policy reporting. By default, it keeps using Etcd and the PolicyReports CRDs.
This paves the way to implementing more performant storage solutions for policy
reporting, such as a relational database backend.
See `--set auditScanner.store` in the kubewarden-controller chart for
configuring it.

## Kwctl changes

When doing `kwctl inspect` we now hide signatures by default, for brevity. One
can still obtain them using `kwctl inspect --show-signatures`. In addition,
`kwctl inspect -o yaml` now will produce correct YAML.

## Helm charts changes

In addition to feature flags, bumps of dependencies, and policy versions, the
kubewarden-defaults chart now can configure `securityContexts`
for the default PolicyServer via the `--set securityContexts` value.
Also, mutating policies shipped as part of kubewarden-defaults chart now target
exclusively the lower type of resource (Pods).

The Policy Reporter sub-chart is now configured to not show by default the
"Logs" tab. You can configure it (and other related things) through the
`policy-reporter` value of the kubewarden-controller chart.

## General housekeeping

Last but not least, as part of our ongoing efforts, we continuously refactor
and expand the test coverage of the codebase. While not end-user actionable,
the byproduct is more reliability.

## Stay tuned!

As always, we are curious about what features you would like next and how you are
enjoying Kubewarden. Reach out on [Slack](https://kubernetes.slack.com/?redir=%2Fmessages%2Fkubewarden)
or join our [monthly community meeting](https://teamup.com/ks2bj74dvw132mhjtj?view=a&showProfileAndInfo=0&showSidepanel=1&disableSidepanel=1&showMenu=1&showAgendaHeader=1&showAgendaDetails=0&showYearViewHeader=1)
to talk Kubewarden!
