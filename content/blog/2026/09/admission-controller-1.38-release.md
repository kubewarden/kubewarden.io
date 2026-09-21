---
title: "Admission controller 1.38 Release"
authors:
  - Víctor Cuadrado Juan
  - José Guilherme Vanz
date: 2026-09-21
components:
  - Admission Controller
types:
  - release
  - security-advisory
---

Welcome to the monthly release of Admission Controller. On the menu for this
month we have a handful of security fixes and a scalability improvement.

Let's go through each serving!

## Hardening namespaced policies

The issue has been found by [@Pinguladora](https://github.com/Pinguladora),
who filed [this GitHub security advisory](https://github.com/kubewarden/adm-controller/security/advisories/GHSA-3ppr-x76g-fjjm).

Prior to this release, the Kubewarden Admission Controller had a hard coded
list of Kubernetes resources that namespaced policies were not allowed to
interact with. This approach did not scale well. That's why, starting from the
1.38.0 release, the Admission Controller has an **allow list** of resources
that namespaced policies can interact with. This list can be changed using the
`namespacedPoliciesAllowedResources` value of our helm chart. By default, our
helm chart provides a list of resources that we consider safe for namespaced
policies to validate or mutate.

This change not only fixes the initial security report, but improves
the security posture of the Admission Controller.

`namespacedPoliciesAllowedResources` does not permit wildcards (`*`) or
subresources (like `pods/exec`) as entries. The controller skips such entries
and logs a warning. But a policy rule can still target a subresource of a
permitted resource. An empty list rejects every namespaced policy.

**This is a breaking change.** The controller still accepts a policy that
targets a resource that is not on the list. But it does not deploy that policy.
The policy gets the new `rejected` status. In practice, this means that the
controller ignores the policy. The controller sets a `PolicyActive` condition
that names the resources that are not permitted, and it creates no webhooks for
the policy.

When a cluster operator adds the missing resources to the list, the
controller deploys the policy again. No further action is necessary. The
reverse also applies. A running policy becomes rejected when its resources
leave the list.

After the upgrade, namespaced policies that target resources outside the
default allow list become `rejected`. The controller also removes their
webhooks. If your namespaced policies target other resources, add those
resources to `namespacedPoliciesAllowedResources`.

`ClusterAdmissionPolicy` and `ClusterAdmissionPolicyGroup` are not
affected by this change. Cluster-wide policies already need cluster-wide
privileges.

Please refer to our
[documentation](https://docs.kubewarden.io/admission-controller/1.38/en/howtos/security-hardening/security-hardening.html#_namespaced_policy_allowed_resources)
for more details.

## Hardening policy evaluation against memory exhaustion

We also hardened policy evaluation against memory exhaustion. Without this
hardening, a buggy or malicious policy can exhaust the memory of the
policy-server or of the `kwctl` process. This needs an extreme case: tens of
thousands of concurrent cluster requests, and a policy crafted to reserve
memory for each request.

We identified two different memory-related attack vectors.

The first one was specific to WASI policies. We put some generous limits on
the communication channels used by WASI policies to exchange data with the
host. Depending on the channel, the limits are 64 MiB for the STDOUT (used
only to return the full JSON of a modified object) and 8 MiB for the STDERR
(used only to return backtraces when a policy panics).

The second fix applies to all types of policies. It's a limit on the
amount of memory that can be allocated by each policy during its
evaluation. Starting from this release, the Policy Server
limits to 256 MiB the maximum amount of memory a policy can allocate.

The value can be changed or completely removed by using environment
variables. Please refer to our
[documentation](https://docs.kubewarden.io/admission-controller/1.38/en/reference/policy-evaluation-timeout.html#_policy_memory_limit)
for more details.

## Fixing an unbounded memory growth with context-aware policies

On top of reporting the security issue mentioned above,
[@Pinguladora](https://github.com/Pinguladora) discovered that
Policy Server memory grew steadily and never came down when using context-aware policies.

In their setup, the memory of the Policy Server pods grew up to 22 GiB. The
policy made around 28 million calls to reach that point. That caused the pods
to be terminated by the OOM-killer.

The cause turned out to be the caches for context-aware host calls such as
`can_i` and `get_resource`. The cache was implemented with the
[`cached` crate](https://github.com/jaemk/cached)
with a TTL and no size bound. The `cached` library removes an expired
entry only when the same key is queried again.
Context-aware policies produce a stream of distinct keys (unique pod names,
service accounts, subjects), so if those entries are unique, the cache keys
accumulated forever. The TTL marked the entries as not fresh, but nothing
removed the entries from memory.

We fixed the issue by switching to a different caching library,
the [`moka` crate](https://github.com/moka-rs/moka).

With the fix in place, our test cluster used only 47.2 MiB after 60,000 unique
keys were created. It also released this memory during idle time. The `moka`
heap peaked at +4.7 MB and decayed to 3.15 MB:

{{< figure class="center" src="/images/1.38-memory-growth.svg" width="100%" alt="Heap growth: cached grows and freezes, moka peaks and decays">}}

This is great, getting our memory back. It's expensive to waste
memory these days!

But not only that. We knew that the `cached` crate held a global lock across
the backend call, and `moka` is async. With `cached`, the concurrent misses for
different keys gave us a maximum roof of requests-per-second (rps). In my laptop,
this meant about 480 rps. In contrast, `moka` runs in parallel, which
tremendously increases the throughput:

{{< figure class="center" src="/images/1.38-miss-throughput.svg" width="100%" alt="Unique-key flood throughput">}}

The lock also made cache hits queue behind in-flight misses. In a 90% hit /
10% miss workload at concurrency 64, the median dropped from 12.8 ms to
42 µs in my laptop:

{{< figure class="center" src="/images/1.38-mixed-p50.svg" width="100%" alt="Mixed workload median latency">}}

At normal request rates the change is latency-neutral: 12 e2e runs at
200 rps and probes at 1000 rps showed parity between the two
implementations.

Again, huge thanks to [@Pinguladora](https://github.com/Pinguladora) for the initial
detailed report with reproducer.

[issue #1950]: https://github.com/kubewarden/adm-controller/issues/1950
[PR #1952]: https://github.com/kubewarden/adm-controller/pull/1952


## Getting in touch

Join the conversation on
[Slack](https://kubernetes.slack.com/?redir=%2Fmessages%2Fkubewarden) or
[GitHub discussions](https://github.com/orgs/kubewarden/discussions) and let us
know how you're finding Kubewarden 1.38!
