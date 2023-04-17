---
title: Kubewarden 1.6.0 is released!
authors:
- Flavio Castelli
date: 2023-04-17
---

We are pleased to announce the availability of the Kubewarden 1.6.0 stack.

This release brings stability, performance and security improvements. All packed
with a new major feature. Let's dig into the changes!

## Security Improvements

The Kubewarden controller is ran using a dedicated Service Account. Prior to this
release, the Service Account had access to a series of Kubernetes resources
across the entire cluster.

Starting from this release, the Kubewarden controller Service Account has a
more limited access to the cluster. Access to some resources is now tied to
the Namespace inside of which the controller is deployed.

This reduces the impact an attacker could have if he manages to steal the
Service Account used by our controller.

This security issue has been reported by [Nanzi Yang](https://github.com/younaman),
during an independent security audit. This issue has been assigned the following
CVE `CVE-2023-22645`.

This change, not only improved the security posture of the controller, but it
also reduced its memory consumption and made it more responsive.

## Context Aware Policies

The majority of the policies operate in "isolation", meaning that at evaluation
time they can take a decision by using only the information provided by the
Kubernetes API server.

On the opposite, a Context Aware Policy requires access to Kubernetes-related
informations. For example, a Context Aware Policy that monitors the creation
of Ingress objects could request the list of already existing Ingresses
during its evaluation time. Based on this data, the policy would be able to
understand whether the soon-to-be-created Ingress object would conflict with
any of the already existing Ingresses or not.

Context Aware Policies have read-only access to the cluster. At deployment time
the Kubernetes administrator will define the list of Kubernetes resources
the policy has access to.
The Kubewarden platform will block access to any Kubernetes resources that the
Kubernetes administrator didn't approve.

The allow list is defined on a per-policy basis, making it possible to have
really granular access to the Kubernetes resources.

For more details, take a look at
[this](https://docs.kubewarden.io/explanations/context-aware-policies)
section of our documentation.

## Give it a try!

You can use our official helm chart to upgrade to the latest version.

You can reach out to us on [slack](https://kubernetes.slack.com/?redir=%2Fmessages%2Fkubewarden)
or join our [monthly community meeting](https://teamup.com/ks2bj74dvw132mhjtj?view=a&showProfileAndInfo=0&showSidepanel=1&disableSidepanel=1&showMenu=1&showAgendaHeader=1&showAgendaDetails=0&showYearViewHeader=1)
to talk more about Kubewarden!
