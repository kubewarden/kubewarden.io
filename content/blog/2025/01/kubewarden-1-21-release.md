---
title: Kubewarden 1.21 release
authors:
  - Víctor Cuadrado Juan
  - Flavio Castelli
date: 2025-01-30
---

We're excited to announce the release of Kubewarden v1.21, our first release of 2025!


The release addresses two security issues that the Kubewarden team has discovered. Detailed information about them is included below.
While these issues do not have a critical impact, we recommend our users upgrade their Kubewarden deployments.

Alongside these security fixes, the 1.21 release includes the usual stream of dependency updates and features some improvements to our documentation.

Finally, we have some updates about our presence on social media.

## Security fixes

The Kubewarden team discovered two security issues affecting the Kubewarden controller. Both of them received a dedicated CVE.


### Information leak via AdmissionPolicyGroup resource

> This issue received [CVE-2025-24784](https://github.com/kubewarden/kubewarden-controller/security/advisories/GHSA-756x-m4mj-q96c)

The [policy group feature](https://docs.kubewarden.io/explanations/policy-groups), added to by the 1.17.0 release,
introduced two new types of CRD: `ClusterAdmissionPolicyGroup` and `AdmissionPolicyGroup`. The former is cluster wide, while the latter is namespaced.

By being namespaced, the `AdmissionPolicyGroup` has a constrained impact on cluster resources. So, it’s considered safe to allow non-admin users
to create and manage these resources in namespaces they own.
Kubewarden policies can be permitted to query the Kubernetes API at evaluation time; these types of policies are called "[context aware](https://docs.kubewarden.io/reference/spec/context-aware-policies)".
Context aware policies can perform "`list`" and "`get`" operations against a Kubernetes cluster. The queries are done using the ServiceAccount of the Policy Server instance that hosts the policy.
That means that access to the cluster is determined by the RBAC rules that apply to that ServiceAccount.
The AdmissionPolicyGroup CRD allowed the deployment of context aware policies. This could allow an attacker to obtain information about resources that are out of their reach, by leveraging a higher access to the cluster granted to the ServiceAccount token used to run the policy.

The impact of this vulnerability depends on the privileges granted to the ServiceAccount used to run the Policy Server. It assumes that users are using the recommended best practice
of keeping the Policy Server's ServiceAccount least privileged. By default, the Kubewarden helm chart grants access to the following resources (cluster wide) only: Namespace, Pod, Deployment and Ingress.

Starting from the 1.21.0 release, the AdmissionPolicyGroup CRD does not allow the definition of context aware policies. No modifications are needed, either for performing the upgrade or afterwards.

#### Workaround

On clusters running Kubewarden < 1.21.0, the following Kubewarden policy can be applied to prevent the creation of AdmissionPolicyGroup resources that have access to Kubernetes resources:

```yaml
apiVersion: policies.kubewarden.io/v1
kind: ClusterAdmissionPolicy
metadata:
  name: "deny-admission-policy-groups-with-context-resources"
spec:
  module: registry://ghcr.io/kubewarden/policies/cel-policy:latest
  settings:
    variables:
      - name: hasContextAwareResources
        expression: "object.spec.policies.exists(p, has(object.spec.policies[p].contextAwareResources))"
      - name: isPendingDeletion
        expression: "has(object.metadata.deletionTimestamp)"
    validations:
      - expression: "!variables.hasContextAwareResources || variables.isPendingDeletion"
        message: "AdmissionPolicyGroup has contextAwareResources defined"
  rules:
    - apiGroups: ["policies.kubewarden.io"]
      apiVersions: ["v1"]
      operations: ["CREATE", "UPDATE"]
      resources: ["admissionpolicygroups"]
  mutating: false
  backgroundAudit: true
```

Once the policy is applied, the [Kubewarden Audit Scanner](https://docs.kubewarden.io/howtos/audit-scanner) can be used to identify the
AdmissionPolicyGroup policies that are violating this policy.

### AdmissionPolicy and AdmissionPolicyGroup policies can be used to alter PolicyReport resources

> This issue received [CVE-2025-24376](https://github.com/kubewarden/kubewarden-controller/security/advisories/GHSA-fc89-jghx-8pvg)

By design, AdmissionPolicy and AdmissionPolicyGroup can evaluate only namespaced resources. The resources to be evaluated are determined by the rules provided by the user when defining the policy.
There might be Kubernetes namespaced resources that should not be validated by AdmissionPolicy and AdmissionPolicyGroup policies because of their sensitive nature.
For example, PolicyReports are namespaced resources containing the list of non-compliant objects in a namespace. See [this section](https://docs.kubewarden.io/explanations/audit-scanner/policy-reports)
of Kubewarden’s documentation for more details about PolicyReport resources.
An attacker can use either an AdmissionPolicy or an AdmissionPolicyGroup to prevent the creation and update of PolicyReport objects to hide non-compliant resources.
Moreover, the same attacker might use a mutating AdmissionPolicy to alter the contents of the PolicyReport created inside of the namespace.

Starting from the 1.21.0 release, the validation rules applied to AdmissionPolicy and AdmissionPolicyGroup have been tightened to prevent them from validating sensitive types of namespaced resources.
The new validation will also restrict the usage of wildcards when defining apiGroups and resources rules for AdmissionPolicy and AdmissionPolicyGroup objects.

#### Workaround

On clusters running Kubewarden < 1.21.0, the following Kubewarden policy can be applied to prevent the creation of AdmissionPolicy and AdmissionPolicyGroup resources
that interact with PolicyReport resources:

```yaml
apiVersion: policies.kubewarden.io/v1
kind: ClusterAdmissionPolicy
metadata:
  name: "deny-interaction-with-policyreport"
spec:
  module: registry://ghcr.io/kubewarden/policies/cel-policy:latest
  settings:
    variables:
      - name: hasWildcardInsideOfApiGroup
        expression: "object.spec.rules.exists(r, r.apiGroups.exists(ag, ag == '*'))"
      - name: hasWildcardInsideOfResources
        expression: "object.spec.rules.exists(r, r.resources.exists(ag, ag == '*' || ag == '*/*' || ag == 'policyreports/*'))"
      - name: dealsWithPolicyReportApiGroup
        expression: "object.spec.rules.exists(r, r.apiGroups.exists(ag, ag == 'wgpolicyk8s.io'))"
      - name: dealsWithPolicyReportResource
        expression: "object.spec.rules.exists(r, r.resources.exists(ag, ag == 'policyreports' || ag == 'policyreports/'))"
      - name: isPendingDeletion
        expression: "has(object.metadata.deletionTimestamp)"
    validations:
      - expression: |
          !( variables.hasWildcardInsideOfApiGroup ||
             variables.hasWildcardInsideOfResources ||
             variables.dealsWithPolicyReportResource ||
             variables.dealsWithPolicyReportApiGroup
          ) || variables.isPendingDeletion
        message: "cannot target PolicyReport resources or use wildcards in apiGroups or resources"
  rules:
    - apiGroups: ["policies.kubewarden.io"]
      apiVersions: ["v1"]
      operations: ["CREATE", "UPDATE"]
      resources: ["admissionpolicies", "admissionpolicygroups"]
  mutating: false
  backgroundAudit: true
```

## Documentation improvements

### ArgoCD tutorial

The Kubewarden documentation now provides detailed information about [using ArgoCD](https://docs.kubewarden.io/howtos/argocd-installation) to deploy and
manage the Kubewarden stack.

This document was the result of community interaction.

### CLI documentation

The Kubewarden documentation now has pages describing the behavior of the `policy-server` and the `kwctl` cli tools.

These pages are automatically synchronized with the actual implementation, they can be found here:
[kwctl](https://docs.kubewarden.io/reference/kwctl-cli),
[Policy Server](https://docs.kubewarden.io/reference/policy-server-cli).

These documentation pages can also be generated locally using the new docs subcommands. For example, to generate the kwctl documentation you can
invoke the following command: `kwctl docs --output docs.md`. 

### New pages

As part of improvements suggested by a CNCF documentation review a [personas](https://docs.kubewarden.io/next/personas)
and a [document organization](https://docs.kubewarden.io/next/organization) page have been added.
Also, the introduction section has been reworded to highlight Kubewarden’s benefits more effectively.

## New social media presence

We’re happy to inform you that we have left X and you can now follow the Kubewarden project on Mastodon and on Bluesky using these accounts:
- [Bluesky](https://bsky.app/profile/kubewarden.io)
- [Mastodon](https://bsky.app/profile/kubewarden.io)

### Getting in touch

As always, we welcome your feedback and contributions. Feel free to reach out
to us on [Slack](https://kubernetes.slack.com/?redir=%2Fmessages%2Fkubewarden)
and [GitHub discussions](https://github.com/orgs/kubewarden/discussions).

