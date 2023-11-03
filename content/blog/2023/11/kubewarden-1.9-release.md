---
title: Kubewarden 1.9.0 release
authors:
  - Flavio Castelli
date: 2023-11-03
---

Not even a month after the 1.8.0 release, today we are happy to announce Kubewarden 1.9.0! 🎉🥳

This release includes two major features that have been requested by our community.

## Making Rego policies context-aware

[Context-aware policies](https://docs.kubewarden.io/explanations/context-aware-policies) have been introduced
with Kubewarden 1.6.0. These policies can obtain information about other Kubernetes resources at evaluation time.
This allows them to make decisions based not only on the information provided by the `AdmissionReview` object they
receive.

Initially, this feature was available only to policies written using traditional programming languages. However, starting
from the 1.9.0 release, the policies written using Rego can use cluster information.

Kubewarden can run policies written in Rego that target both the
[Gatekeeper](https://open-policy-agent.github.io/gatekeeper/website/) and the
[`kube-mgmt`](https://github.com/open-policy-agent/kube-mgmt)
platforms. In both cases, the Kubernetes information is shared with the policy using the same format used by these
platforms. That means there's no need to rewrite your Gatekeeper/kube-mgmt policies. 😎

As proof, look at the [unique-ingress policy](https://github.com/kubewarden/unique-ingress-policy), which
is a copy and paste of [this](https://open-policy-agent.github.io/gatekeeper-library/website/validation/uniqueingresshost/)
Gatekeeper reference policy.

However, there's a security improvement provided by Kubewarden: each context-aware policy has access only to the
Kubernetes resources specified by the Kubernetes administrator. On the other hand, with Gatekeeper and kube-mgmt, the
resources shared with the policies are defined globally. That means that all the policies have access to
the same set of Kubernetes resources, regardless of being either context-aware or using all these resources.

## Validate generic requests

Initially, Kubewarden was created to validate Kubernetes admission requests. However, our community has recently
expressed an interest in reusing the Kubewarden policy platform to write validation/mutation policies not specific to
Kubernetes.

Starting from the 1.9.0 release, we introduce the concept of _"raw policies"_. These are regular Kubewarden policies that
validate arbitrary JSON objects. They could validate Terraform plans, GitHub Actions, AWS CloudFormation resources &hellip;
They are exposed by the Kubewarden Policy Server using the dedicated `/validate_raw` endpoint.

The Policy Server instances managed by the Kubewarden controller cannot be used to host Raw policies;
a user managed one must be allocated to host them.
The controller will not allow the user to change the Policy Server ConfigMap to add a Raw policy,
since it will try to reconcile it reverting the changes.

More details about raw policies can be found [here](https://docs.kubewarden.io/howtos/raw-policies).
A detailed blog post will also be posted in the next few days.

## See you around!

As always, we are curious about what features you would like next and how you are
enjoying Kubewarden. Reach out on [Slack](https://kubernetes.slack.com/?redir=%2Fmessages%2Fkubewarden)
or join our [monthly community meeting](https://teamup.com/ks2bj74dvw132mhjtj?view=a&showProfileAndInfo=0&showSidepanel=1&disableSidepanel=1&showMenu=1&showAgendaHeader=1&showAgendaDetails=0&showYearViewHeader=1)
to talk Kubewarden!

Moreover, if you are attending KubeCon North America Chicago, don't be shy and visit the Rancher booth to say hello! 🤗
