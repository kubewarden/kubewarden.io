---
title: Introducing the CEL policy
authors:
  - Victor Cuadrado Juan
date: 2024-06-14
---

We are pleased to announce a new policy by the Kubewarden team: **cel-policy**.

This new policy uses the [Common Expression Language (CEL)](https://cel.dev).
For those new to CEL, it is a general-purpose expression language designed to
be fast, portable, and safe to execute. CEL as a language is memory-safe,
side-effect free, terminating (as in "programs cannot loop forever"), and strong &
dynamically typed.

CEL is a perfect candidate for extending the Kubernetes API, as CEL expressions
can be easily inlined into CRD schemas, and compiled and type-checked
"ahead-of-time" (when CRDs are created and updated). With Kubernetes 1.30, CEL features such as
[ValidatingAdmissionPolicies](https://kubernetes.io/docs/reference/access-authn-authz/validating-admission-policy)
and other validation rules are now marked as stable.

## cel-policy: What's inside

For including CEL functionality, Kubernetes API server uses the upstream
[cel-go](https://pkg.go.dev/github.com/google/cel-go). In addition, Kubernetes
also provides different CEL libraries that live in `apiextensions-apiserver`
and enrich the CEL experience. These range from standard functions and macros,
to supplemental functions for strings, lists, regex, URls, etcetera.

In Kubewarden, policies are Wasm modules. And in particular, we have [WASI
policies](https://github.com/kubewarden/docs/pull/414). Hence with all the
pieces falling in place, it is only logical that we compile both the usptream CEL Go interpreter
Go and the additional Kubernetes CEL libraries, and ship it as a Go WASI
policy: cel-policy. You can find it as always in
[artifacthub.io](https://artifacthub.io/packages/kubewarden/cel-policy/cel-policy):

TODO artifacthub widget

## A CEL superset, backwards-compatible

The new `cel-policy` provides a new DSL approach to Kubewarden, and thanks to
reusing the exact same codebase, has backwards-compatibility for CEL Kubernetes
code such as the one used in [ValidatingAdmissionPolicies](https://kubernetes.io/docs/reference/access-authn-authz/validating-admission-policy)
and [matchConditions](https://kubernetes.io/docs/reference/access-authn-authz/validating-admission-policy/#matching-requests-matchconditions).

But this is not all. In addition, `cel-policy` bundles a **Kubewarden CEL extension library** that exposes
Kubewarden's [host capabilities as native
CEL](https://github.com/kubewarden/cel-policy?tab=readme-ov-file#host-capabilities). This includes:

- Sigstore verification
- OCI interaction
- Cryptographic functions
- Network operations
- Access to Kubernetes resources

## What does this mean for me?

As a Kubewarden policy user, you now have a new DSL that is backwards
compatible with CEL Kubernetes code. This policy doesn't need to be compiled,
and can be used with different CEL code by instantiating it with different
`spec.settings`.

And since it is a Kubewarden policy, we get all the Kubewarden features:

- Information about resources already in-cluster via Audit Scanner, and not
  only about CREATE/UPDATE/DELETE requests.
- Deployed as (Cluster)AdmissionPolicy, with PolicyServer segregations.
- Benefits from Kubewarden's tracing and telemetry on policies.
- Can be developed and tested out-of-cluster thanks to kwctl.
- And more.

If you would like to see examples of Kubewarden-only functionality with the
`cel-policy`, have a [look at our docs](https://docs.kubewarden.io/tutorials/writing-policies/CEL/intro-cel).

## Reusing a ValidatingAdmissionPolicy

An example is worth a thousand self-written YAML lines. Let's reuse the following
ValidatingAdmissionPolicy that checks for the amount of replicas in a
Deployment:

```yaml
apiVersion: admissionregistration.k8s.io/v1
kind: ValidatingAdmissionPolicy
metadata:
  name: "replicalimit-policy.example.com"
spec:
  failurePolicy: Fail
  matchConstraints: # (1)
    resourceRules:
      - apiGroups: ["apps"]
        apiVersions: ["v1"]
        operations: ["CREATE", "UPDATE"]
        resources: ["deployments"]
  variables: # (2)
    - name: maxreplicas
      expression: int(5)
  validations: # (3)
    - expression: "object.spec.replicas <= variables.maxreplicas"
      messageExpression: "'the number of replicast must be less than or equal to ' + string(variables.maxreplicas)"
---
apiVersion: admissionregistration.k8s.io/v1
kind: ValidatingAdmissionPolicyBinding
metadata:
  name: "replicalimit-binding-test.example.com"
spec:
  policyName: "replicalimit-policy.example.com"
  validationActions: [Deny]
  matchResources:
    namespaceSelector: # (4)
      matchLabels:
        environment: test
```

Let's write an equivalent Kubewarden policy. You can notice that `rules`
(1), `settings.variables` (2), `settings.validations` (3), and
`namespaceSelector` (4) are directly lifted and copy-pasted from the VAP
counterpart:

```yaml
apiVersion: policies.kubewarden.io/v1
kind: ClusterAdmissionPolicy
metadata:
  annotations:
    io.kubewarden.policy.category: Resource validation
    io.kubewarden.policy.severity: low
  name: "cel-policy-replica-example"
spec:
  module: registry://ghcr.io/kubewarden/policies/cel-policy:v1.0.0
  failurePolicy: Fail
  mode: protect
  rules: # (1)
    - apiGroups: ["apps"]
      apiVersions: ["v1"]
      operations: ["CREATE", "UPDATE"]
      resources: ["deployments"]
  settings:
    variables: # (2)
      - name: maxreplicas
        expression: int(5)
    validations: # (3)
      - expression: "object.spec.replicas <= variables.maxreplicas"
        messageExpression: "'the number of replicast must be less than or equal to ' + string(variables.maxreplicas)"
  backgroundAudit: true
  namespaceSelector: # (4)
    matchLabels:
      environment: test
```

To see a full-featured comparison, [head to our docs](https://docs.kubewarden.io/tutorials/writing-policies/CEL/reusing-vap).

## Let's stay in touch!

We hope you are as excited as we are about this new policy!

As always, we are curious about what features you would like next and how you are
enjoying Kubewarden. Reach out on [Slack](https://kubernetes.slack.com/?redir=%2Fmessages%2Fkubewarden)
or join our [monthly community meeting](https://teamup.com/ks2bj74dvw132mhjtj?view=a&showProfileAndInfo=0&showSidepanel=1&disableSidepanel=1&showMenu=1&showAgendaHeader=1&showAgendaDetails=0&showYearViewHeader=1)
to talk all things Kubewarden.
