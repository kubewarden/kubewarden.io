---
title: Kubewarden 1.23 release
authors:
  - Flavio Castelli
date: 2025-03-26
---

The wait is over—Kubewarden 1.23 has arrived! Packed with exciting security enhancements,
smoother workflows, and important updates, this release is here to make your Kubernetes
experience even better. Let's dive into what’s new!

## Hardening of the admission webhooks

[Kubernetes Dynamic Admission Controllers](https://kubernetes.io/docs/reference/access-authn-authz/extensible-admission-controllers/),
like Kubewarden, work by providing a webhook server
that implements the validation/mutation API defined by the Kubernetes project.
These webhook servers are usually deployed within the same cluster as regular Kubernetes workloads.
They are exposed internally using Kubernetes' `Service` resources.

The majority of the time, the only legitimate consumer of these webhooks is the Kubernetes API
Server. However, due to [Kubernetes' network model](https://kubernetes.io/docs/concepts/services-networking/),
any Pod running in the cluster can make requests against them.

This attack surface can be reduced by limiting who can actually interact with these webhook servers.

One way to reduce this attack surface is by deploying network policies, but an even stronger approach is
using mutual TLS (mTLS). With mTLS, both the client and server verify each other's identity using
certificates, ensuring secure and encrypted communication while blocking unauthorized access.

Starting from this release, all the Kubewarden webhooks can be protected using mTLS. This can be done using
a configuration option in our helm charts.
Unfortunately this cannot be turned on by default, since some manual operations are required by the
administrator of the Kubernetes cluster.
[This howto](https://docs.kubewarden.io/howtos/security-hardening/webhook-mtls) explains how to enable
mTLS when deploying Kubewarden on k3s.

Finally, take a look at [this reference documentation](https://docs.kubewarden.io/reference/security-hardening/webhooks-hardening)
to learn more about how to perform security hardening of Kubewarden webhooks. This
includes information both about mTLS and reference network policies that can be used
to improve the security posture of your deployment.

## Support of PSA `restricted` profile

Kubernetes [Pod Security Admission (PSA)](https://kubernetes.io/docs/concepts/security/pod-security-admission/)
is a stable feature since the Kubernetes 1.25 release. It provides a way to validate the workloads created
in a Namespace using different set of rules. These rules are hard-coded in Kubernetes
and are grouped into three different profiles, ranging from relaxed to strict.

Starting from this release, the `restricted` profile of the Pod Security Admission is now fully
supported out of the box.
This means you can enforce stricter security policies against the Kubewarden stack, ensuring
its workloads adhere to Kubernetes' best practices without hassle.
Prior to this release, the default values of our helm chart required some small tuning to be compliant
with the `restricted` profile.

The only action required to the administrator of the cluster is to add a label to the Namespace where the
Kubewarden stack is being deployed.

To enforce the strict profile create a Namespace like the following one:

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: kubewarden
  labels:
    pod-security.kubernetes.io/enforce: restricted
```

For more details, consult the official [Kubernetes documentation](https://kubernetes.io/docs/tasks/configure-pod-container/enforce-standards-namespace-labels/).

## Bug fixes, dependency updates and small improvements

As always, we've addressed bugs and updated dependencies to ensure a smooth experience.

### kubectl

Starting from this release, a [spinner](https://github.com/kubewarden/kwctl/pull/1116) is now shown
when pulling images. Thanks to Kiraat for their contribution!

The `scaffold artifacthub` command has been simplified. Some of its mandatory flags, like the policy version,
are now read from the `io.kubewarden.policy.version` annotation from the `metadata.yml` file.

Finally, the libraries used to render the output of the `inspect` command have been replaced with more
actively maintained ones. This lead to a slightly different output compared to before in terms of colors
and styling.

### Kubernetes recommended labels

Different components of the Kubewarden stack (Deployment, Pods, Services) now use the Kubernetes
[recommended labels](https://kubernetes.io/docs/concepts/overview/working-with-objects/common-labels/#labels).
By following these best practices, writing selectors for Kubewarden components is now simpler and
more intuitive.

## Google Summer of Code

We're proud to announce that Kubewarden has two projects available under CNCF's Google Summer of Code.
You can find all the details [here](https://github.com/cncf/mentoring/blob/main/programs/summerofcode/2025.md#kubewarden).

## Getting in touch

Join the conversation on
[Slack](https://kubernetes.slack.com/?redir=%2Fmessages%2Fkubewarden)
or
[GitHub discussions](https://github.com/orgs/kubewarden/discussions).
and let us know how you're using Kubewarden 1.23!
