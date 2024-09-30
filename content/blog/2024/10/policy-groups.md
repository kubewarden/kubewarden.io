---
title: Policy Groups deep dive
authors:
  - Víctor Cuadrado Juan
date: 2024-11-04
---

With [v1.17](https://www.kubewarden.io/blog/2024/10/kubewarden-1-17-release/),
we introduced a new powerful feature, Policy Groups, enabled by two new Kubernetes
Custom Resources:

- **AdmissionPolicyGroups**: Namespaced policy comprised of several policies.
- **ClusterAdmissionPolicyGroups**: Clusterwide policy comprised of several policies.

These new Policy Groups resources define a policy comprised of several policies and
their policy settings, and they perform a combined evaluation of those multiple
policies using logical operators.

Why are these useful? Because they reuse existing policies, reducing the need
for custom policy creation. And they provide complex logic while at the same
time reducing complexity as you have all the logic contained in one resource
definition.

## Writing a Policy Group

AdmissionPolicyGroups and ClusterAdmissionPolicyGroups are similar to the
policies you already know. Let's start writing a ClusterAdmissionPolicyGroup
that ensures Service selectors are unique, or assigned to a specific
organization team.

We write the usual metadata and rules for the policy:

```yaml
apiVersion: policies.kubewarden.io/v1
kind: ClusterAdmissionPolicyGroup
metadata:
  name: unique-service-selector
spec:
  rules:
    - apiGroups: [""]
      apiVersions: ["v1"]
      resources: ["services"]
      operations: ["CREATE", "UPDATE"]
```

### Policies field & context-aware

Now, we define several policies and their settings. This is done in the
`spec.policies` map:

```yaml
policies:
  unique_service_selector:
    module: registry://ghcr.io/kubewarden/policies/unique-service-selector-policy:v0.1.0
    contextAwareResources:
      - apiVersion: v1
        kind: Service
    settings:
      app.kubernetes.io/name: MyApp
  owned_by_quokkas_team:
    module: registry://ghcr.io/kubewarden/policies/safe-annotations:v0.2.9
    settings:
      mandatory_annotations:
        - owner
      constrained_annotations:
        owner: "quokkas-team"
```

In this map, you can see we have defined 2 policies. One that checks for
Services to be unique, and another that checks for an annotation `owner:
foo-team`. These policy entries in the map are named. And this allows us
to write a boolean expression combining the results of each policy.

If you look closer, you will see that the `unique_service_selector`
policy is context-aware, as it defines its own `contextAwareResources`. That's
true, Policy Groups support context-aware policies, and will evaluate them as
usual, with their fine-grained defined permissions.

### Expresion field & mutation

We evaluate that logic in the `spec.expression`. In our case:

```yaml
expression: "unique_service_selector() || (!unique_service_selector() && owned_by_quokkas_team())"
```

Which means that we expect the Service selector to be unique, or if it isn't,
to be owned by the Quokkas team. The Quokkas team is awesome; they know how to
keep a secure house.

The `expression` is a boolean one, evaluating the known policy identifiers
defined in the Policy Group. We can use `&&`, `||`, `!` for AND, OR, and NOT
operations, as well as `(`,`)` for evaluation priorities.

The expression evaluation has a short-circuit and only evaluates those that are
needed; if one of the boolean results is true and nothing else is needed to
accept or reject, the other evaluations are not performed to save resources.

The short-circuit means that we don't support mutation for Policy Groups, which simplifies evaluation and the conceptual load.

### Message field

Ok, so we know how the policy gets evaluated and rejected or accepted.
But how do we express that to users? We do it by setting its
`spec.message`, which gets returned as part of the AdmissionResponse as usual,
to kubectl, or whoever expects it.

In our case, we can write:

```yaml
message: "the service selector is not unique or the service is not owned by the foo team"
```

In addition, all the evaluation details of each of the group policies are sent as part
of the AdmissionResponse `.status.details.causes` as we will see later.

## Hands-on: Instantiating

Our Policy Group looks as follows:

```yaml
# unique-service-selector.yml
---
apiVersion: policies.kubewarden.io/v1
kind: ClusterAdmissionPolicyGroup
metadata:
  name: unique-service-selector
spec:
  rules:
    - apiGroups: [""]
      apiVersions: ["v1"]
      resources: ["services"]
      operations: ["CREATE", "UPDATE"]
  policies:
    unique_service_selector:
      module: registry://ghcr.io/kubewarden/policies/unique-service-selector-policy:v0.1.0
      contextAwareResources:
        - apiVersion: v1
          kind: Service
      settings:
        app.kubernetes.io/name: MyApp
    owned_by_quokkas_team:
      module: registry://ghcr.io/kubewarden/policies/safe-annotations:v0.2.9
      settings:
        mandatory_annotations:
          - owner
        constrained_annotations:
          owner: "quokkas-team"
  expression: "unique_service_selector() || (!unique_service_selector() && owned_by_quokkas_team())"
  message: "the service selector is not unique or the service is not owned by the Quokkas team"
```

We can apply it as usual:

```console
$ kubectl apply -f unique-service-selector.yml
clusteradmissionpolicygroup.policies.kubewarden.io/unique-service-selector created
$ kubectl get clusteradmissionpolicygroups.policies.kubewarden.io
NAME                      POLICY SERVER   MUTATING   BACKGROUNDAUDIT   MODE      OBSERVED MODE   STATUS    AGE
unique-service-selector   default                    true              protect   protect         active    30s
```

On Policy Group instantiation, both the `spec.expression` and each of the policies'
settings get validated, and if any is incorrect, one gets an error as expected.

Our policy is now active and ready. Let's try to create a Service:

```console
kubectl apply -f - <<EOF
# my-service.yml
apiVersion: v1
kind: Service
metadata:
  name: my-service
spec:
  selector:
    app.kubernetes.io/name: MyApp
  ports:
    - protocol: TCP
      port: 80
      targetPort: 9376
EOF

service/my-service created
```

As expected, the service creation succeeded. It is the first service that uses the selector for `MyApp`.

Now, if we create a second service, reusing the selector:

```console
kubectl apply -f - <<EOF
# second-service.yml
apiVersion: v1
kind: Service
metadata:
  name: second-service
spec:
  selector:
    app.kubernetes.io/name: MyApp
  ports:
    - protocol: TCP
      port: 80
      targetPort: 9376
EOF

Error from server: error when creating "STDIN":
admission webhook "clusterwide-group-unique-service-selector.kubewarden.admission" denied the request:
the service selector is not unique or the service is not owned by the Quokkas team
```

We get a rejection as expected.

## Obtaining full details on results

We know that for rejecting that `second-service`, the Policy Group evaluated
each of their policies, only if it was needed. Kubewarden exposes this
information as part of the AdmissionResponse's `.status.details.causes`. This
will include skipping policy evaluations when possible.

These can be seen by tools, for example by increasing the verbosity level of kubectl:

```console
kubectl -v4 apply -f second-service.yml
I0927 14:00:37.262003  107266 cert_rotation.go:137] Starting client certificate rotation controller
I0927 14:00:37.527613  107266 helpers.go:246] server response object: [{
  "kind": "Status",
  "apiVersion": "v1",
  "metadata": {},
  "status": "Failure",
  "message": "error when creating \"second-service.yml\": admission webhook \"clusterwide-group-unique-service-selector.kubewarden.admission\" denied the request: the service selector is not unique or the service is not owned by the Quokkas team",
  "details": {
    "causes": [
      {
        "message": "service is using selector(s) already defined by these services: [\"my-service\"]",
        "field": "spec.policies.unique_service_selector"
      },
      {
        "message": "The following mandatory annotations are missing: owner",
        "field": "spec.policies.owned_by_quokkas_team"
      }
    ]
  },
  "code": 400
}]
Error from server: error when creating "second-service.yml": admission webhook "clusterwide-group-unique-service-selector.kubewarden.admission" denied the request: the service selector is not unique or the service is not owned by the Quokkas team
```

### Audit scanner

Another way of obtaining details on the state of the cluster is the [Audit
Scanner](https://docs.kubewarden.io/next/explanations/audit-scanner).
Policy Groups are fully supported in the Kubewarden stack, and their results
get published to Policy Reports.

## Recap

We have seen the 2 new Policy Groups Custom Resources: **\*AdmissionPolicyGroups** and
**ClusterAdmissionPolicyGroups**. They provide a way to define complex policies
by including definitions of existing policies. They support context-aware
policies, yet they don't perform mutations.

We look forward to your usages of Policy Groups to simplify your policing,
particularly with paired with CEL via the [cel-policy](https://artifacthub.io/packages/kubewarden/cel-policy/cel-policy).

Have a look at their CRD
[reference](https://docs.kubewarden.io/reference/CRDs#resource-types) docs,
their [explanation](https://docs.kubewarden.io/explanations/policy-groups) and
[how-to](https://docs.kubewarden.io/next/howtos/policy-groups) on our docs.

## Getting in touch

As always, if you have any questions or feature requests, you can contact us
through [Slack](https://kubernetes.slack.com/?redir=%2Fmessages%2Fkubewarden)
and [GitHub discussions](https://github.com/orgs/kubewarden/discussions).
