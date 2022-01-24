---
title: Kubewarden policies cover all the Kubernetes Pod Security Policies.
authors:
	- José Guilherme Vanz
date: 2022-01-31
---

The Kubewarden team worked tirelessly to create equivalent Kubewarden policies
for all the deprecated Pod Security Policies (PSP). In order to reach this very
important milestone, the team wrote the policies with the same validations
available in the Kubernetes PSPs, and we counted on the community help to map
and validate the policies.

This will allow our users to replace deprecated PSPs while continuing to enforce
their security rules.

The Kubewarden policies which replace all the Kubernetes PSPs, are available
in the Policy Hub, and you can find them by typing the keyword "PSP". And, to
have the exact same behavior of the Kubernetes PSPs is necessary a minimum version
for some of the Kubewarden components, which are:
- Kubewarden controller v0.4.5
- Policy Server version v0.2.6

You may are thinking: why do I need to use these specific versions?

The answer is related to "requests mutation". Let me explain.

In the previous versions of Kubewarden Policy Server, if a policy mutated a
request and it's configured as a "mutating" policy, the Policy Server would
always accept the request and this behavior is not aligned with the Kubernetes
PSP validation.

Instead, you should be able to reject a request even if a mutation happens.
To solve this misalignment, the team changed the Kubewarden controller and
Policy Server to allow you configure a mutating policy to behave like a
validated one. But if you don't need it, you can use the policies in previous
Kubewarden versions as well.

Since the Kubewarden controller and Policy Server versions update, if you mark
a policy as "mutating" (setting `true` in the "mutating" field in the
ClusterAdmissionPolicy resource), the mutated requests will be accepted as before.
In the other hand, if you deploy a policy which mutates requests with the
"mutating" field set to `false`, the requests will be rejected.

This means Kubewarden now have policies which cover 100% of the deprecated PSPs,
and they behave the same way than the PSPs.

Thanks to the community for helping the team spot missing policies and the
discrepancies between the Kubernetes PSPs and Kubewarden policies. The combined
work is what made Kubewarden reach this important milestone.

