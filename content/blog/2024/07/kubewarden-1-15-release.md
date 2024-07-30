---
title: Kubewarden 1.15 release
authors:
  - Jose Guilherme Vanz
date: 2024-07-30
---

# Kubewarden v1.15.0 release

We are thrilled to announce the release of Kubewarden v1.15.0! This version
comes packed with CEL policy updates, controller enhancements, and fixes that
make Kubewarden even more robust and user-friendly.

## Enhanced PolicyServer CRD with Tolerations 

One of the standout features of Kubewarden v1.15 is the extension of the
`PolicyServer` Custom Resource Definition (CRD) to include a list of
[`Toleration` objects](https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/)
to be used in the deployment created for the Policy Server. This
enhancement allows users to specify tolerations directly within the
`PolicyServer` CRD, simplifying the management of taints and tolerations across
your Kubernetes cluster. By integrating this directly into the CRD, Kubewarden
ensures a more streamlined and consistent approach to handling node
tolerations, making it easier to deploy policies in diverse and dynamic
environments.

## Centralized Management of Tolerations, Affinity, and Anti-Affinity 

In line with making the deployment process more efficient, Kubewarden v1.15
introduces a central place where tolerations, affinity, and anti-affinity rules
are specified and enforced across all components of the stack (controller deployment,
audit scanner cronjob and default Policy Server). This centralized management
approach not only simplifies the configuration process but also ensures
consistency and reduces the chances of configuration drift. By defining these
rules once and applying them universally, users can achieve a more reliable and
predictable policy enforcement setup.

> ⚠️ **Warning** ⚠️
> The affinity configuration previously present in the default policy server values 
> has been removed. Then, if you were using it, you need to migrate your configuration

## Technical Debt Reduction in Kubewarden Controller 

For v1.15, significant efforts were made to reduce technical debt in the
Kubewarden controller, ensuring better performance, easier maintenance, and a
more robust foundation. Key changes include:

- **Updated Golang Linter**: The stricter linter catches potential issues
  early, ensuring higher code quality.
- **Removed --default-policy-server CLI Flag**: The default policy server name
  is now always `default`, simplifying configuration.
- **Updated to Kubebuilder 4.0.0**: The controller code now uses Kubebuilder
  4.0.0.
- **Refactored Reconciler Code**: The code is split into multiple
  subreconcilers following the Subreconciler pattern, enhancing manageability
  and modularity.
- **File/Package Renaming**: Files and packages have been renamed for better
  readability and navigation.

These changes improve functionality and set the stage for more streamlined
development and maintenance, reflecting a commitment to maintaining a
high-quality codebase.

## Performance improvements

During the controller refactoring, we removed unnecessary Kubernetes clients,
including one that wasn't using a cache. With this client now eliminated, we've
reduced the load on the API server.


## Policy Grouping Code Implementation 

The v1.15 release marks the beginning of implementing [RFC 0020: Policy
Group](https://github.com/kubewarden/rfc/blob/main/rfc/0020-policy-group.md),
starting with changes to the policy server. This feature allows users to create
complex policies by combining simpler ones and using existing policies to
avoid custom builds from scratch. The motivation is to increase reusability,
reduce cognitive load, and enable the creation of custom policies through a
DSL-like configuration, thus improving policy management efficiency and
flexibility.

This feature is not yet available to Kubernetes users, since we've not yet introduced
the set of new Custom Resource Definition that are required to manage policy groups.
This will be part of the next release of Kubewarden.

In the meantime, users running Kubewarden Policy Server in stand-alone mode, can
can already use this feature.

> **Note:** in case you have missed, it's possible to use Kubewarden's Policy Server
> to validate any kind of JSON payload. See [this section](https://docs.kubewarden.io/howtos/raw-policies)
> of our documentation.

## CEL Policy Enhancements 

The Common Expression Language (CEL) policies in Kubewarden have received two
notable enhancements:

- **OCI Capability for Fetching Configs**: Now includes an OCI capability to
  fetch container image configurations, making it easier to retrieve and apply
  policy configurations from OCI-compliant registries.
- **Lazy Variable Evaluation**: Introduces lazy variable evaluation, deferring
  variable evaluation until needed, thus improving performance and efficiency
  by reducing unnecessary computations.

## Extended policies CRDs with MatchConditions 

Lastly, the ClusterAdmissionPolicy and AdmissionPolicy CRDs have been extended
to include [`matchConditions`](https://kubernetes.io/docs/reference/access-authn-authz/extensible-admission-controllers/#matching-requests-matchconditions).
This enhancement provides users with more
granular control over policy enforcement by allowing them to specify conditions
under which policies should be applied. Therefore, users can ensure that the
right rules are enforced in the right scenarios.

The propagation of `matchConditions` can be done only on these
versions of Kubernetes:

- 1.26 or earlier: not available. The `matchConditions` are ignored
- 1.27, 1.28, 1.29: available only when the `AdmissionWebhookMatchConditions`
  [feature gate](https://kubernetes.io/docs/reference/command-line-tools-reference/feature-gates/) is enabled. Otherwise, the `matchConditions` are ignored
- 1.30 or later: always available, no action required

## Bye and Let's stay in touch!

Stay tuned for more updates, and happy policy writing!

As always, we are curious about what features you would like next and how you
are enjoying Kubewarden. Reach out on
[Slack](https://kubernetes.slack.com/?redir=%2Fmessages%2Fkubewarden) or join
our [monthly community
meeting](https://teamup.com/ks2bj74dvw132mhjtj?view=a&showProfileAndInfo=0&showSidepanel=1&disableSidepanel=1&showMenu=1&showAgendaHeader=1&showAgendaDetails=0&showYearViewHeader=1) to
talk all things Kubewarden.
