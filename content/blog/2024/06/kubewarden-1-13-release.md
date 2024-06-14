---
title: Kubewarden 1.13 release
authors:
  - Flavio Castelli
date: 2024-06-06
---

I'm pleased to announce a new release of Kubewarden, version 1.13. This release features a series of
improvements and bug fixes that contribute to better performance and stability.

Let's go through the most significant changes.

## Policy Server memory usage

A community member reported that the Kubewarden Policy Server was using a lot of memory, especially
when running context aware policies on big clusters. The number of resources being accessed by the
policies was significantly high, in the order of 3200 Namespaces, 10500 Ingresses, 200 ClusterRoleBindings
and 11000 RoleBindings.
Under certain circumstances, the amount of memory being used caused the Policy Server to be terminated by the kernel's OOM killer.

After some investigation, we found two different root causes of this issue.

The first one was related to [kube-rs](https://github.com/kube-rs), the Rust library we use to interact with Kubernetes.
The library was doing excessive allocations when building the initial state of a resource. We fixed this issue
with [this PR](https://github.com/kube-rs/kube/pull/1494).
With this fix we reduced the peak of memory usage caused by the creation of the initial state of a Kubernetes resource.

The second issue was related with how the memory allocator of Rust works. By default, Rust uses the system allocator (glibc malloc in our case).
It turns out the system allocator is not releasing the allocated memory back to the system when this is no longer needed.
We changed Policy Server to use the [jemalloc](http://jemalloc.net/) allocator which, on top of providing great performance, has many
configuration knobs.
After some experimentation, we found the right balance between performance and memory usage.

With these two changes, we were able to reduce the peak of memory consumption of the Policy Server significantly, plus we reduced the
idle memory consumption.
As a pleasant side effect, we also noticed an improvement in the performances of the Policy Server thanks to the usage of jemalloc.

These are some numbers we obtained while doing performance tests of a Gatekeeper policy fetching, among other resources, 10000 RoleBindings:

|                    | HTTP Request Duration (avg) | Max RSS Under load | Idle RSS |
| ------------------ | :-------------------------: | :----------------: | :------: |
| Policy Server 1.12 |          436.15ms           |       1.4 Gb       |  1.2 Gb  |
| Policy Server 1.13 |          233.663ms          |       1.2 Gb       |  264 Mb  |

## Audit Scanner improvements

The Audit Scanner runs regularly inside Kubernetes clusters to determine the compliance status of its resources.
It does that by issuing many HTTP requests against the Policy Servers. A Policy Server can be backed by multiple replicas of
the Policy Server Pod.

We got reports from users that the Audit Scanner was always talking with only one of the replicas. This caused the following issues.
First, the audit scan was slow. Second, when running with multiple replicas, one of the Policy Server Pods was overloaded with requests,
while the other ones were idle.

This issue was caused by how the Go HTTP client works. By default, the Go HTTP client uses a connection pool to reuse HTTP connections.
Once we turned off this behavior we immediately saw the requests being spread between the different replicas of the Policy Server.

Note: the Audit Scanner accesses the Policy Server by going through the `ClusterIP` of the Service that exposes that Policy Server internally.
The `kube-proxy` component is responsible for load balancing the requests between the different Pods of the Policy Server.

Once this limitation was removed, we saw a significant reduction of the processing time of the Audit Scanner, especially on clusters with many policies and
resources to evaluate.

However, not all the operations done by the Audit Scanner were happening in parallel. Starting from this release, all the operations done by the Audit Scanner
are done in parallel. The amount of parallelism can be configured by the end user with different flags.
Please refer to the [official documentation](https://github.com/kubewarden/audit-scanner/blob/v1.13.0/README.md#tuning) to learn more about these tuning parameters.

## Controller improvements

Some community users [reported](https://github.com/kubewarden/kubewarden-controller/issues/645) that the Kubewarden Controller was
generating too many requests against the Kubernetes API server.

During the 1.13 development cycle, we changed the way the Kubewarden Controller interacts with the Kubernetes API server. We removed
some technical debt and then we optimized how we make use of the Kubernetes client-go library.

That lead to a 50% reduction in the number of requests done by the Kubewarden Controller.

We plan more work in this area during future releases.

Finally, by addressing the technical debt we have also been able to improve the code coverage rate of the Kubewarden Controller's codebase.

## A new exciting policy coming soon

During the 1.13 development cycle, we have been working on a new policy that will be released soon. This policy is worth a dedicated blog post,
so stay tuned!

## Let's stay in touch!

As always, we are curious about what features you would like next and how you are
enjoying Kubewarden. Reach out on [Slack](https://kubernetes.slack.com/?redir=%2Fmessages%2Fkubewarden)
or join our [monthly community meeting](https://teamup.com/ks2bj74dvw132mhjtj?view=a&showProfileAndInfo=0&showSidepanel=1&disableSidepanel=1&showMenu=1&showAgendaHeader=1&showAgendaDetails=0&showYearViewHeader=1)
to talk all things Kubewarden.
