---
title: Kubewarden 1.14 release
authors:
  - Jose Guilherme Vanz
date: 2024-06-25
---

# Kubewarden v1.14.0 release

We are thrilled to announce the release of Kubewarden v1.14.0! This version
comes packed with new capabilities, enhancements, and fixes that make
Kubewarden even more robust and user-friendly.

## New Host Capability for Container Image Configuration

One of the significant updates in this release is the introduction of a new
host capability that allows policies to fetch the container image
configuration. This update stems from a [user
request](https://github.com/kubewarden/user-group-psp-policy/issues/75) to
enhance the `user-group-psp-policy` policy by enabling it to check the user
defined to run the container in the image configuration. Previously, this
information was not accessible through the available host capabilities, as it
was not included in the image manifest. Thanks to the functionality provided by
the `oci-distribution` crate, which already has a method to fetch this
information, we were able to extend our policy evaluator and SDKs to expose
this capability. 

## New CEL Policy on Artifact Hub

Recently we've released our new  meta-policy policy that allows to
run [CEL](https://cel.dev/) expressions against
Kubernetes resources. It's now available on [Artifact
Hub](https://artifacthub.io). For more insights into this policy and its
applications, refer to our recent [blog
post](https://www.kubewarden.io/blog/2024/06/welcome-cel-policy/).

## Introducing "kwctl scaffold vap" Command

With Kubernetes v1.26, the
[ValidatingAdmissionPolicy](https://kubernetes.io/docs/reference/access-authn-authz/validating-admission-policy/)
(VAP) was introduced, providing a way to write custom admission policies using
the [Common Expression Language (CEL)](https://cel.dev/), extended with
Kubernetes-specific functionalities. This feature reached stability in
Kubernetes v1.30.

Kubewarden now offers a CEL policy capable of running Kubernetes VAP policies
without any modifications. The new `kwctl scaffold vap` command simplifies the
migration of VAP policies to Kubewarden, enabling users to leverage the
benefits of running these policies within the Kubewarden framework. For a
detailed guide on how to use this new feature, check out
[this section of our documentation](https://docs.kubewarden.io/howtos/vap-migration).

## Policy Fixes

In this release, we have addressed two issues in our existing policies:

1. **[Environment Variable
   Policy](https://artifacthub.io/packages/kubewarden/environment-variable-policy/environment-variable-policy)**:
   Previously, variables with values were not blocked if only the name was
   specified in the settings. We have updated the validation code to ensure
   that the policy will validate the names even when the user does not define
   the envvar value in the rule. The problem was describe in depth by [this issue](https://github.com/kubewarden/environment-variable-policy/issues/13).
   
2. **[Container Resources
   Policy](https://artifacthub.io/packages/kubewarden/container-resources/container-resources)**:
   Users faced issues when trying to create policies with only CPU settings
   empty memory values. The policy settings were sent with empty values,
   causing validation errors. We have fixed this by allowing a single resource
   setting to be empty, resolving the issue without breaking policy usage. The problem was describe in depth by [this issue](https://github.com/kubewarden/container-resources-policy/issues/33).

## Best Practices: Domain-Qualified Finalizers

The Kubewarden controller now follows best practices by using domain-qualified
finalizers. Users must be aware that if they downgrade a Kubewarden
installation, the old controller will not be able to identify the new
finalizer. Leaving the cluster in a state where the resource could not be
removed and therefore requiring manual intervention. 

NOTE: Downgrade procedures are not supported by Kubewarden project. See the
[documentation](https://docs.kubewarden.io/reference/upgrade-path#downgrades)
to learn more about that.

## KCD Italy: CEL for Cluster Security

One of the Kubewarden maintainers,  [Flavio
Castelli](https://github.com/flavio/),  delivered an insightful talk at [KCD
Italy](https://community.cncf.io/events/details/cncf-kcd-italy-presents-kcd-italy-2024/)
on "How to leverage and extend CEL for your cluster security." He explored the
capabilities and trade-offs of the CEL-based admission controller introduced in
Kubernetes 1.28 and discussed how to use CEL with other dynamic admission
controllers. This talk highlighted the practical applications and advantages of
using CEL for cluster security.

While the talk has been delivered in Italian, the slides are written in English and can be found [here](https://flavio.castelli.me/2024/06/25/kcd-italy---cel-kubernetes-validatingadmissionpolicy-and-kubewarden/).

## Known Bugs and Future Plans

During the release process, we identified a bug related to the policy server
certificate rotation. While the Root CA is set to expire in 10 years, each
policy-server cert secret has a one-year expiry. But the controller is
currently unable to renew them automatically. In this release, we will ensure
that policy-server secrets are created with a 10-year expiry. And in future
releases we plan to properly implement an automated renewal process. For now,
users can manually delete the expired cert secret (`policy-server-default`) and
trigger the controller reconciliation by adding/removing/updating a policy or by adjusting the number of replicas of a `PolicyServer`.

## Let's stay in touch!

As always, we are curious about what features you would like next and how you
are enjoying Kubewarden. Reach out on
[Slack](https://kubernetes.slack.com/?redir=%2Fmessages%2Fkubewarden) or join
our [monthly community
meeting](https://teamup.com/ks2bj74dvw132mhjtj?view=a&showProfileAndInfo=0&showSidepanel=1&disableSidepanel=1&showMenu=1&showAgendaHeader=1&showAgendaDetails=0&showYearViewHeader=1) to
talk all things Kubewarden.
