---
title: "Admission controller 1.38 Release"
authors:
  - Víctor Cuadrado Juan
date: 2026-09-17
---

TODO

## Fixing an unbounded memory growth with context-aware policies

A user reported to us that the policy-server memory grew steadily and never
came down when using context-aware policies. In their setup, the memory
of the policy-server grew to 22GB (!). This is incredible, and needed around
28 million of unique `can_i` host-capability calls from the policies to reach
that memory consumption. Of course, in their setup the policy-server got
OOM-killed.

The cause turned out to be the caches for context-aware host calls such as
`can_i` and `get_resource`. The caches used the `cached` crate with a TTL and
no size bound. In this cache implementation from the `cached` library, the
cache removes an expired entry only when the same key is queried again.
Context-aware policies produce a stream of distinct keys (unique pod names,
service accounts, subjects), so if those entries are unique, the cache keys
accumulated forever. The TTL marked the entries as not fresh, but nothing
removed the entries from memory.

After pondering several options, we decided to move to a different cache
implementation, with the crate [moka](https://github.com/moka-rs/moka). `moka` removes expired
entries during routine cache operations, so memory follows the current
request rate instead of the total number of unique keys ever seen. The cache
behavior does not change: same TTL windows, same keys, and concurrent misses
for the same key still make one backend call.

We verified the fix end to end on a cluster. After 60,000 unique keys, the
`cached` heap held +47.2 MB and released zero bytes during idle. The `moka`
heap peaked at +4.7 MB and decayed to 3.15 MB:

{{< figure class="center" src="/images/1.38-memory-growth.svg" width="100%" alt="Heap growth: cached grows and freezes, moka peaks and decays">}}

This is already great, as we are getting our memory back. Bad days to waste
memory nowadays!

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

Huge thanks to [@Pinguladora](https://github.com/Pinguladora) for the initial
detailed report with reproducer.

[issue #1950]: https://github.com/kubewarden/adm-controller/issues/1950
[PR #1952]: https://github.com/kubewarden/adm-controller/pull/1952
[moka]: https://github.com/moka-rs/moka


## Getting in touch

Join the conversation on
[Slack](https://kubernetes.slack.com/?redir=%2Fmessages%2Fkubewarden) or
[GitHub discussions](https://github.com/orgs/kubewarden/discussions) and let us
know how you're finding Kubewarden 1.38!
