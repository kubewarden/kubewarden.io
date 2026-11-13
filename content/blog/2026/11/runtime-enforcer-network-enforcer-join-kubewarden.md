---
title: Kubewarden is expanding into runtime security
authors:
- Dan Čermák
- John Krug
date: 2026-11-15
components:
  - Network Enforcer
  - Runtime Enforcer
types:
  - community
---

The Kubewarden project started in 2021 as an admission controller,
focusing on validating and rejecting Kubernetes Resources. Kubewarden
pioneered a few novel concepts, including compiling policies into WebAssembly
and distributing them as OCI artifacts via OCI registries. Policies can be
written in Rust, Go, Rego and CEL, among others. Existing Gatekeeper,
OPA and Kubernetes policies can be reused as well.

Kubewarden joined the CNCF sandbox in 2022 and has remained
a fully open source and vendor neutral admission control framework for
Kubernetes. In 2025, Kubewarden expanded beyond pure admission control with
the addition of
[`SBOMscanner`](/blog/2025/11/expanding-kubewarden-scope/). `SBOMScanner` helps
to secure the actual workloads to be deployed and ties into the scope of
Kubewarden, securing the cluster by preventing vulnerable and insecure workloads
from being deployed.


## Expanding into Runtime Security

Runtime Security is increasingly important in an ever faster moving
world, where critical vulnerabilities are discovered daily and can
take only hours until being actively exploited. Preventing vulnerable
workloads from being deployed is no longer sufficient, a workload that is
safe today, could become exploitable tomorrow. It is more important than ever that
we can secure a cluster against exploited workloads.

Kubewarden is answering this growing threat by introducing two new projects,
Runtime Enforcer and Network Enforcer!


### Runtime Enforcer

[Runtime Enforcer](https://www.kubewarden.io/component/runtime-enforcer/)
monitors which binaries are executed in a container and prevents undesired ones
from being executed. It utilizes eBPF in the Linux kernel to monitor and
restrict execution in each container.

Runtime Enforcer works in three phases:

- Learn: the workload is observed and from its behavior a
  `WorkloadPolicyProposal` is created. The proposal can then be promoted into a
  `WorkloadPolicy`.

- Monitor: workloads with a matching `WorkloadPolicy` are actively monitored for
  violations. No processes are blocked and violations are reported as
  OpenTelemetry events.

- Protect: same as monitor, but executions violating the `WorkloadPolicy` are
  blocked.

Runtime Enforcer allows you to gradually introduce an allowlist for
binaries in each container. In protect mode it blocks everything beyond the
allowlist. This allows you to forbid an application container from launching a
shell or calling `curl`.
Check out the [Runtime Enforcer
Documentation](https://docs.kubewarden.io/runtime-enforcer/) and find the source
code on [GitHub](https://github.com/kubewarden/runtime-enforcer)!


### Network Enforcer

[Network Enforcer](https://www.kubewarden.io/component/network-enforcer/) is the
networking counterpart to Runtime Enforcer, it monitors network traffic into and
out of workloads, creates policies from the observations and then monitors
violations and enforces these policies in protect mode. Network Enforcer builds
on existing cloud native networking stacks and integrates with the following:

- Calico via Goldmane
- Cilium via Hubble Relay
- Istio Ambient via ztunnel

Policies are created in the networking stack's native format (Istio
`AuthorizationPolicy` or a Kubernetes `NetworkPolicy`) so you
keep using your existing networking layer, while allowing you to monitor and
restrict a workload's networking traffic. This allows you to prevent undesired
communications of a compromised workload. For instance the container serving the
frontend could be allowed to contact the API server, but not the
database. Traffic to the database could be then blocked.
Network Enforcer operates in the same Learn-Monitor-Protect modes as Runtime
Enforcer:

- Learn: Network Enforcer observes the traffic of your workloads and creates a
  `WorkloadNetworkPolicyProposal` from that.

- Monitor: violations of a promoted policy proposal are logged and emitted as
  OpenTelemetry events.

- Protect: traffic violating the policy is blocked and reported as in monitor
  mode.

Note that learning mode only supports locations **inside** the
cluster. Additionally, for Calico and Cillium both ingress and egress TCP & UDP
traffic is supported, while with Istio only inbound TCP traffic can be monitored
and controlled.

Check out the [Network Enforcer
Documentation](https://docs.kubewarden.io/network-enforcer/latest/en/introduction.html)
and find the source code on
[GitHub](https://github.com/kubewarden/network-enforcer).


## Looking Ahead

Network Enforcer and Runtime Enforcer are young projects, with
Network Enforcer being experimental and Runtime Enforcer in Beta. They are the
next step on the road of Kubewarden's mission to deliver an all-round security
solution for protecting your cluster!

Help us build and shape the future of Kubernetes security by giving both a try!
Head over to the Quickstart guides of [Runtime
Enforcer](https://docs.kubewarden.io/runtime-enforcer/latest/en/installation/quickstart.html)
and [Network
Enforcer](https://docs.kubewarden.io/network-enforcer/latest/en/quickstart.html),
deploy them in a test cluster, record policy proposals, promote them into
policies and then enable monitor mode. Let us know what you liked and what you
didn't by joining the conversation on
[Slack](https://kubernetes.slack.com/?redir=%2Fmessages%2Fkubewarden) or open a
thread on [GitHub discussions](https://github.com/orgs/kubewarden/discussions)!
