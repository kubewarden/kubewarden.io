---
title: Kubewarden 1.10 release
authors:
  - Víctor Cuadrado
date: 2024-1-24
---

We have the first release of 2024, Kubewarden 1.10.0! 🎉🥳
And this one contains a nice bag of goodies, let's have a look!

## Policy server has reduced memory usage and increased reliability

A nice graph is worth a thousand words!

TODO add nice graph

Notice the slightly lower memory consumption, and constant consumption when
scaling horizontally.

This graph represents the memory consumption of 1 instance of policy-server,
loaded with 13 policies:

- 4 instances of "verify-signatures"
- 5 of "pod-privileged"
- 2 of "go-wasi-template" (a 20MB policy, WASI being experimental)
- 1 Rego policy
- 1 normal Rust policy

The policy-server got configured 1 worker and went up to 8. For each worker
value, 10 samplings were taken.

#### Constant memory consumption when scaling horizontally

Before, we needed one instance of the policy evaluator (hence Wasmstime stack)
per each specific policy deployed.

Now, memory consumption is constant no matter how many parallel policy
evaluators we spawn when we scale horizontally by increasing the number of
threads available in the machine. This is achieved by only creating an instance
of the policy evaluator per unique type of policy module.

For example, if a user has the apparmor policy deployed 5 times (with different
names, settings, etc), now only one instance of PolicyEvaluator will be
allocated for all of those 5 deployments.

In addition, we rely now on Wasmtime's pre-initialization of Wasm modules. This
allows us to keep a deduplicated list of all the policies in use, in their
pre-initialize form. This list is shared between all policy evaluators in the
policy-server.

#### Protection against policy mem leaks, and clean slate per policy

Before, there were long-running policy evaluators, ready to process policy requests.

Now, policy evaluation mode happens on-demand: we receive a request, a fresh
policy evaluator is created, used just for evaluation that request, and
discarded.

This is possible as we now leverage Wasmtime's pre-initialization, hence
creation time of policy evaluators in greatly reduced.

Using this on-demand approach to policy evaluators brings 2 main advantages:

- Impact of policies leaking memory is now virtualy non-existent.
- Each evaluation starts with a clean slate, preventing bugs caused by policies
  leaving unclean state between evaluations.

#### Codebase simplification and increased test coverage

Also, thanks to a big refactor, together with additional unit and integration
tests, the policy-server codebase has moved away from using a worker thread
pool for policy evaluation and into an async approach, removing codebase complexity.

Stay tunned for more performance improvements!

## WASI policies written in Go can now be context aware

Thanks to recent improvements in the official Go compiler, we have added
context-aware capabilities via WASI on to the kubewarden Go SDK, hence it is
now possible to write context-aware Go WASI policies.

As an example, have a look at the
[go-wasi-context-aware-test-policy](https://github.com/kubewarden/go-wasi-context-aware-test-policy).

See the WASI updated docs [here](TODO).

## Controller

The controller now reconciles divergences bewtween `ClusterAdmissionPolicies`
and `AdmissionPolicies` and their associated webhook objects, mitigating
possible attacks which delete or modify policy webhooks, changing or stopping
policies from working. (these attacks where already mitigated by RBAC rights).

## Audit Scanner

Thanks to the community, the Audit Scanner can now be run with an in-memory store
for policy reporting. By default, it keeps using Etcd and the PolicyReports CRDs.
This paves the way to implementing more performant storage solutions for policy
reporting, such a relational database backend.
See `--set auditScanner.store` in the kubewarden-controller chart for
configuring it.

## Kwctl

When doing `kwctl inspect` we now hide signatures by default for brevity. One
can still obtain them using `kwctl inspect --show-signatures`. In addition,
`kwctl inspect -o yaml` will produce sane YAML.

## General housekeeping

As our ongoing effort, we continously refactor and expand test coverage of the
codebase. While not end-user actionable, the byproduct is more reliability.

## Helm chart

In addition of feature flags, bumps of dependencies and policy versions, the
kubewarden-defaults chart now has the ability to configure `securityContexts`
for the default PolicyServer via the `--set securityContexts` value.

The Policy Reporter subchart is now configured to not show by default the
"Logs" tab. One can configure it (and other related things) through the
`policy-reporter` value of the kubewarden-controller chart.

## Stay tuned!

As always, we are curious about what features you would like next and how you are
enjoying Kubewarden. Reach out on [Slack](https://kubernetes.slack.com/?redir=%2Fmessages%2Fkubewarden)
or join our [monthly community meeting](https://teamup.com/ks2bj74dvw132mhjtj?view=a&showProfileAndInfo=0&showSidepanel=1&disableSidepanel=1&showMenu=1&showAgendaHeader=1&showAgendaDetails=0&showYearViewHeader=1)
to talk Kubewarden!
