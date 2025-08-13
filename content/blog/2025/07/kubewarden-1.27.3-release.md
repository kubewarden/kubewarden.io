---
title: "Kubewarden 1.27.3 Patch Release"
authors:
  - Víctor Cuadrado Juan
date: 2025-08-13
---

We have just released 1.27.3, a small patch release for `kwctl`.
This newly released kwctl version `v1.27.3` fixes a bug on the
`kwctl run` subcommand for _ClusterPolicyGroups_ and _PolicyGroups_.

When evaluating policies and policy groups, both `kwctl` and `policy-server`
take care of running the policies in the correct execution mode that the
policies have defined via their
[metadata](https://docs.kubewarden.io/tutorials/writing-policies/metadata).
This means that Kubewarden policies that are Wasm modules intended to run as
WASI are executed as such. The same applies, for example, to Rust policies compiled for
WAPC or to [OPA
policies](https://docs.kubewarden.io/tutorials/writing-policies/rego/open-policy-agent/build-and-run#run).

Up until `kwctl` 1.27.2, when doing `kwctl run` of a ClusterPolicyGroup or
PolicyGroup, `kwctl` wasn't extracting the execution mode from the metadata information
of the policies part of the group, but using the default execution mode.
This meant that when mixing different policies, it would fail, for
example, with:

```console
$ kwctl run policy-group.yml --request-path adm-req.yml
  Successfully pulled policy from registry://ghcr.io/kubewarden/policies/pod-privileged:v1.0.3
  Successfully pulled policy from registry://ghcr.io/kubewarden/policies/container-running-as-user:v1.0.4                                                                                                                 Error: error when building wapc precompiled stack: cannot build Wasmtime engine: unknown import: `env::opa_builtin0` has not been defined

Caused by:
    0: cannot build Wasmtime engine: unknown import: `env::opa_builtin0` has not been defined
    1: unknown import: `env::opa_builtin0` has not been defined
```

Now, `kwctl run` of (Cluster)PolicyGroups will get evaluated correctly.

## Getting in touch

Join the conversation on
[Slack](https://kubernetes.slack.com/?redir=%2Fmessages%2Fkubewarden) or
[GitHub discussions](https://github.com/orgs/kubewarden/discussions) and let us
know how you’re using Kubewarden!
