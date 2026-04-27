---
title: "Admission Controller 1.35 Release"
authors:
  - Víctor Cuadrado Juan
date: 2026-04-27
---


## Security fix: RBAC reconnaissance and host capability calls

Kubewarden makes the following security promise:

**"If you can deploy namespaced policies, you can do so without obtaining
raised privileges."**

Cluster Operators can rely on this promise to provide self-servicing of
policies in Namespaces. Useful for example when servicing several teams.

While this still stands, Ville Vesilehto
([thevilledev](https://github.com/thevilledev) on GitHub) found the following
[security vulnerability](https://github.com/kubewarden/kubewarden-controller/security/advisories/GHSA-wqcw-g35j-j578).
An attacker with elevated permissions to create namespaced policies (which
isn't the default), such as AdmissionPolicies or AdmissionPolicyGroups, can
craft a policy that makes use of the [`kubernetes/can_i` host
capability](https://docs.kubewarden.io/reference/spec/host-capabilities/kubernetes#operation---can_i)
API call. This capability queries the cluster using a SubjectAccessReview to
determine if a specific user or group has the permission to perform an action
on a Kubernetes resource. 

Kubewarden already has a context-aware allow-list via the policy
`spec.contextAwareResources` for capability calls that obtain information from
the cluster such as `kubernetes/get_resource` or
`kubernetes_list_resources_by_namespace`.

However, `can_i` does not perform that check and forwards the request directly
to the callback handler of the PolicyServer, which executes a real
SubjectAccessReview with the PolicyServer privileges. This constitutes an
information disclosure / reconnaissance issue and not direct workload data
exfiltration. The attacker learns permission information, such as whether
specific service accounts can "get secrets", "create pods", or "bind
clusterroles" in chosen namespaces.

This security vulnerability has receveid **GHSA-wqcw-g35j-j578** (plus an
upcoming CVE identifier), with score 4.3 (moderate).

We thank Ville Vesilehto for finding this vulnerability and the responsible disclosure!

Rather than only adding a gating check for this capability and possibly for
future ones, we want to uphold and double down on our promise. For that, we are
introducing a new feature. Users must evaluate and configure this feature as
needed in their production deployments.

## New security feature: gating host capability calls for namespaced policies

PolicyServers now have a new `spec.namespacedPoliciesCapabilities`, which is a
list of host capability calls that namespaced policies (AdmissionPolicies and
AdmissionPolicyGroups) are allowed to call in that PolicyServer. This new field
accepts wildcard patterns following the same conventions as the
[matchRules](https://kubernetes.io/docs/reference/access-authn-authz/extensible-admission-controllers/#matching-requests-rules)
for Kubernetes Dynamic Admission Controllers. For example, `["oci/v2/*"]`
allows all OCI v2 capabilities only.

An example of a PolicyServer that only allows the `can_i` capability call is as
follows:

```yaml
apiVersion: policies.kubewarden.io/v1
kind: PolicyServer
metadata:
  name: for-namespaced-policies
spec:
  image: ghcr.io/kubewarden/policy-server:latest
  replicas: 1
  namespacedPoliciesCapabilities:
    - kubernetes/can_i
```

See the [reference list of all host capability
identifiers](https://docs.kubewarden.io/next/reference/spec/host-capabilities/host-capabiliy-call-reference).

### Default settings and upgrade configuration

All PolicyServers, including the `default` installed via our
`kubewarden-defaults` Helm chart and custom deployed ones, default to having
their `spec.namespacedPoliciesCapabilities` to `['*']`. This means that by
default they allows all host capability calls for namespaced policies, which is
the status quo prior to this version and backwards-compatible.

Cluster Operators that make use of namespaced AdmissionPolicies and
AdmissionPolicyGroups for their users (not the default) must configure the
PolicyServer `default` from the `kubewarden-defaults` Helm chart value of
`.Values.policyServer.namespacedPoliciesCapabilities`.

For example, to allow no host capabilities set an empty list: `--set
'policyServer.namespacedPoliciesCapabilities={}'`.
To allow only OCI and DNS capabilities: `--set
'policyServer.namespacedPoliciesCapabilities={oci/*,net/v1/dns_lookup_host}'`.

If using custom PolicyServers deployed by themselves, Cluster Operators must:
- Configure their PolicyServers's `Spec.namespacedPoliciesCapabilities` as
  desired, with the list of allowed capabilities.
- Ensure that the namespaced policies are scheduled on those configured
  PolicyServers. This can be done for example with the new
  `ns-policyserver-mapper` policy, as follows.

See more information on this feature in our dedicated [how-to
page](https://docs.kubewarden.io/next/howtos/policy-servers/namespaced-policies-capabilities).

## New policy: `ns-policyserver-mapper`

This policy mutates AdmissionPolicies and AdmissionPolicyGroups to schedule
them in specific PolicyServers. It does this based on a label placed on the
Namespace where each policy is deployed. 

Label each namespace with `admission.kubewarden.io/policy-server:
<desired-PolicyServer>`. Then:

- Namespaces with the label will get any AdmissionPolicies and AdmissionPolicyGroups
  on them mutated, so those policies are scheduled in the desired PolicyServer.

- Namespaces without the label will have any AdmissionPolicies and
  AdmissionPolicyGroups creation or update rejected until the label is added. This
  prevents policies from being silently scheduled on an unintended PolicyServer.

You can find the policy as usual in
[artifacthub.io](https://artifacthub.io/packages/kubewarden/kubewarden-policy-library/ns-policyserver-mapper).

This policy provide one approach on scheduding namespaced policies to specific
PolicyServers, but others are of course possible.

### Self-servicing namespaces

With this new PolicyServer `spec.namespacedPoliciesCapabilities` feature plus
the new `ns-policyserver-mapper` policy, Cluster Operators can configure their
PolicyServers and provide self-service per Namespace, for example to dedicated
teams, without elevated privileges.

For a concrete step-by-step example, have a look at our [how-to page](
https://docs.kubewarden.io/next/howtos/policy-servers/namespaced-policies-capabilities#complete-example-secure-self-service-namespace-setup).

## Threat model expansion

We base our threat model on the Kubernetes SIG Security assessment for Dynamic
Admission Controllers.

We believe that a solid and up-to-date threat model is paramount for our users
to reason about our stack, understand the usability trade-offs of production,
and simplify their deployment.

Therefore, we have updated our Thread model with 3 new cases relevant to
Kubewarden. You can read them in our [Thread model
reference](https://docs.kubewarden.io/reference/threat-model#kubewarden-threats)
documentation page.

## Authoring and auditing a policy with host capability calls

With 1.35, Policy Authors can declare the host capability calls a policy makes
use of under a new metadata field, `hostCapabilities`:

```yaml
# policy metadata.yml, which gets annotated on the Wasm module
---
hostCapabilities:
  - kubernetes/can_i
  - kubernetes/get_resource
```


Also, `kwctl annotate` now performs an heuristic scan of the compiled Wasm
module of a policy. Policy Authors will notice that when annotating a policy
for release, `kwctl` emits warnings to stderr if there's any mismatch with the
declared metadata:

- **Used but undeclared**: host capabilities found in the binary but absent
  from the metadata declaration.
- **Declared but not detected**: host capabilities listed in the metadata but
  not found in the binary.

For example:

```console
$ kwctl annotate -m metadata.yml -o annotated-policy.wasm policy.wasm

WARN host capabilities used by the policy but not declared in metadata
     capabilities={"kubernetes/get_resource"}
WARN host capabilities declared in metadata but not detected in the policy
     capabilities={"oci/v1/verify"}
```

> **NOTE** This self-reporting from the authors and the `kwctl annotate`
> heuristic scan cannot be used as a security boundary, as an untrusted policy
> publisher could embed an arbitrary list.
> 
> Use this information as one signal alongside other trust indicators (image
> signing, source code review, policy provenance, etc) not as an authoritative
> proof of what capabilities a policy exercises.

We have annotated the policies maintained by the Kubewarden team and we will
release new versions shortly.

## Running a policy with host capability calls

With 1.35 `kwctl run` and `kwctl bench` now have a new flag
`--allowed-host-capabilities`. This flag sets the host capabilities the policy
is allowed to use and can be repeated many times. For example:

```console
$ kwctl run \
  --allowed-host-capabilities 'oci/*' \
  --allowed-host-capabilities 'kubernetes/get_resource'
```

`kwctl` will emit errors if the policy has not been granted enough permissions
for the needed capabilities.

This allows Policy Users to assess their policies out-of-cluster.

## Maintenance bumps

This release also comes with complimentary maintenance bumps.
We have updated the codebase to the 1.95 Rust toolchain and Go 1.26
version. For us, this meant some small adjustments to allow the usage Go 1.26
for WASI policies, as well as a new `kubewarden/github-actions` [v5.1.0
release](https://github.com/kubewarden/github-actions/releases/tag/v5.1.0) that
makes use of the newly released TinyGo 0.41, which also brings support for Go
1.26.

## Renaming the NPM package of our JavaScript/TypeScript SDK

One of the SDKs for policies that we provide is the JavaScript/TypeScript SDK.
This SDK is published in
[npmjs.com](https://www.npmjs.com/package/@kubewarden/policy-sdk). With its new
v0.2.0 release, the NPM package has been renamed from `kubewarden-policy-sdk`
and republished under
[`@kubewarden/policy-sdk`](https://www.npmjs.com/package/@kubewarden/policy-sdk).

Give it a try with our policy template at
[github.com/kubewarden/js-policy-template](
https://github.com/kubewarden/js-policy-template)


## Getting in touch

Join the conversation on
[Slack](https://kubernetes.slack.com/?redir=%2Fmessages%2Fkubewarden) or
[GitHub discussions](https://github.com/orgs/kubewarden/discussions) and let us
know how you’re finding Kubewarden 1.35!
