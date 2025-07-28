---
title: "Kubewarden 1.27 Release"
authors:
  - José Guilherme Vanz
date: 2025-07-23
---

Here's a look at the key updates and improvements in the latest release.

## New High-Risk Service Account Policy

In this release, we've introduced a new policy to improve cluster security. The
**High-Risk Service Account Blocker** policy, as its name suggests, blocks
workloads that attempt to run with a service account that has excessive
permissions.

This policy leverages the Kubernetes authorization API and allows cluster
operators to define a list of forbidden permissions. Workloads using a service
account with any of these permissions will be blocked. Check out the policy's
[repository](https://github.com/kubewarden/high-risk-service-account-policy) to
learn more about its configuration.

In the following example, any workload using a service account with some of the
permissions defined in the `blockRules` will be rejected:

```yaml
apiVersion: policies.kubewarden.io/v1
kind: ClusterAdmissionPolicy
metadata:
  annotations:
    io.kubewarden.policy.category: Resource validation
    io.kubewarden.policy.severity: medium
  name: high-risk-service-account
spec:
  module: registry://ghcr.io/kubewarden/policies/high-risk-service-account:latest
  settings:
    blockRules:
      # For listing secrets
      - apiGroups: [""]
        resources: ["secrets"]
        verbs: ["list"]
        # namespace: "default"

      # For executing commands in containers
      - apiGroups: [""]
        resources: ["pods/exec"]
        verbs: ["create"]

      # Full access to all workload resources
      - apiGroups: [""]
        resources: ["pods", "pods/log"]
        verbs: ["*"]
      - apiGroups: ["apps"]
        resources: ["deployments", "statefulsets", "daemonsets", "replicasets"]
        verbs: ["*"]
      - apiGroups: ["batch"]
        resources: ["jobs", "cronjobs"]
        verbs: ["*"]
      - apiGroups: ["autoscaling"]
        resources: ["horizontalpodautoscalers"]
        verbs: ["*"]

      # Full access to RBAC resources within a namespace
      - apiGroups: ["rbac.authorization.k8s.io"]
        resources: ["roles", "rolebindings"]
        verbs: ["*"]
        namespace: "default"
  rules:
    - apiGroups:
        - ""
      apiVersions:
        - v1
      resources:
        - pods
      operations:
        - CREATE
    - apiGroups:
        - ""
      apiVersions:
        - v1
      resources:
        - replicationcontrollers
      operations:
        - CREATE
        - UPDATE
    - apiGroups:
        - apps
      apiVersions:
        - v1
      resources:
        - deployments
        - replicasets
        - statefulsets
        - daemonsets
      operations:
        - CREATE
        - UPDATE
    - apiGroups:
        - batch
      apiVersions:
        - v1
      resources:
        - jobs
        - cronjobs
      operations:
        - CREATE
        - UPDATE
  mutating: false
```

After deploying the above policy, a workload resource using the following service account
will be blocked:

```yaml
---
# ServiceAccount
apiVersion: v1
kind: ServiceAccount
metadata:
  name: super-admin-sa
  namespace: default
---
# Powerful Role with all requested permissions
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: super-admin-role
  namespace: default
rules:
  resources: ["secrets"]
  verbs: ["list"]
---
# RoleBinding for namespace-scoped permissions
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: super-admin-rolebinding
  namespace: default
subjects:
  - kind: ServiceAccount
    name: super-admin-sa
    namespace: default
roleRef:
  kind: ClusterRole
  name: super-admin-role
  apiGroup: rbac.authorization.k8s.io
```

Let's try to deploy something:

```console
kubectl create -f - << EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: super-admin-deployment
  namespace: default
spec:
  replicas: 1
  selector:
    matchLabels:
      app: super-admin-app
  template:
    metadata:
      labels:
        app: super-admin-app
    spec:
      serviceAccountName: super-admin-sa
      containers:
        - name: main
          image: nginx:alpine
          ports:
            - containerPort: 80
        - name: kubectl
          image: bitnami/kubectl:latest
          command: ["sleep", "infinity"]
EOF
Error from server: error when creating "STDIN": admission webhook "clusterwide-high-risk-service-account.kubewarden.admission" denied the request: Cannot use service account 'system:serviceaccount:default:super-admin-sa' with permissions to perform list /secrets in the cluster
```

## New _kubernetes/can-i_ Host Capability

To make the High-Risk Service Account Blocker policy more efficient, this
release introduces a new host capability:
[`kubernetes/can_i`](https://docs.kubewarden.io/reference/spec/host-capabilities/kubernetes#operation---can_i).

This capability uses the Kubernetes `SubjectAccessReview` API to check if
a service account has permission to perform certain operations. This approach
avoids the need to fetch numerous RBAC resources to determine if the service
account can perform the blocked operations, making the check faster and
more reliable.

To support this new capability, the default `ServiceAccount` used in the Helm
chart to run the Policy Server has been updated to add permission to
create `SubjectAccessReview` resources. If you want to use this new capability
with a Policy Server that uses a different `ServiceAccount`, you must update
its permissions accordingly.

## _kwctl_ Now Mirrors _policy-server_ Behavior

The `kwctl` CLI now performs post-policy processing validations and changes
that were previously executed only by the `policy-server`. We've moved the logic
for features like custom error messages and mutation permissions from the
`policy-server` codebase to a shared [evaluation
library](https://github.com/kubewarden/policy-evaluator).

As a result, users running policies with `kwctl` now see the same
behavior that the `policy-server` produces. This is great for testing
policy configurations before deploying them to a cluster.

The post-policy steps also performed by `kwctl` are:

- policy mode enforcement: when the policy is in monitor mode, `kwctl` returns the request as allowed, even if the request was
  rejected by the policy. It prints a warning message with the original result.
- custom error message: `kwctl` will return the error message defined in the
  `message` field when the policy is rejected
- reject mutated requests: `kwctl` will reject a request if the policy mutates
  the request but the `mutating` field is set to `false`

Let's take a look at some examples. Let's consider the following policy in
monitor mode. Therefore, all the evaluations should be allowed. When the policy
is run against a
[request](https://github.com/kubewarden/pod-privileged-policy/blob/main/test_data/privileged_container.json)
with a privileged container, it returns the evaluation as "allowed":

```console
$ cat policy.yaml
apiVersion: policies.kubewarden.io/v1
kind: ClusterAdmissionPolicy
metadata:
  annotations:
    io.kubewarden.policy.category: PSP
    io.kubewarden.policy.severity: medium
  name: pod-privileged-policy
spec:
  module: registry://ghcr.io/kubewarden/policies/pod-privileged:v1.0.3
  settings: {}
  mode: "Monitor"
  rules:
    - apiGroups:
        - ""
      apiVersions:
        - v1
      resources:
        - pods
      operations:
        - CREATE
  mutating: false

 $ kwctl run policy.yaml --request-path test_data/privileged_container.json
  Successfully pulled policy from registry://ghcr.io/kubewarden/policies/pod-privileged:v1.0.3
2025-07-24T20:36:31.253373Z  INFO validate{self=PolicyEvaluator { runtime: "wapc" } settings=PolicySettings({})}:policy_log{self=EvaluationContext { policy_id: "registry://ghcr.io/kubewarden/policies/pod-privileged:v1.0.3", callback_channel: Some(...), allowed_kubernetes_resources: {} }}: policy_log: starting validation data={"column":5,"file":"src/lib.rs","line":33,"policy":"sample-policy"}
2025-07-24T20:36:31.253476Z  INFO policy_evaluator::admission_response_handler: policy evaluation (monitor mode) policy_id="pod-privileged-policy" allowed_to_mutate=false response="AdmissionResponse { uid: \"1299d386-525b-4032-98ae-1949f69f9cfc\", allowed: false, patch_type: None, patch: None, status: Some(AdmissionResponseStatus { status: None, message: Some(\"Privileged container is not allowed\"), reason: None, details: None, code: None }), audit_annotations: None, warnings: None }"
{"uid":"1299d386-525b-4032-98ae-1949f69f9cfc","allowed":true,"auditAnnotations":null,"warnings":null}
```

Now let's change the policy to protect mode, add a custom error message and run
against the same request:

```console
$ cat policy.yaml
apiVersion: policies.kubewarden.io/v1
kind: ClusterAdmissionPolicy
metadata:
  annotations:
    io.kubewarden.policy.category: PSP
    io.kubewarden.policy.severity: medium
  name: pod-privileged-policy
spec:
  module: registry://ghcr.io/kubewarden/policies/pod-privileged:v1.0.3
  settings: {}
  mode: "Protect"
  message: "Nops! You cannot do that!"
  rules:
    - apiGroups:
        - ""
      apiVersions:
        - v1
      resources:
        - pods
      operations:
        - CREATE
  mutating: false
 $ kwctl run policy.yaml --request-path test_data/privileged_container.json
  Successfully pulled policy from registry://ghcr.io/kubewarden/policies/pod-privileged:v1.0.3
2025-07-24T20:39:56.765807Z  INFO validate{self=PolicyEvaluator { runtime: "wapc" } settings=PolicySettings({})}:policy_log{self=EvaluationContext { policy_id: "registry://ghcr.io/kubewarden/policies/pod-privileged:v1.0.3", callback_channel: Some(...), allowed_kubernetes_resources: {} }}: policy_log: starting validation data={"column":5,"file":"src/lib.rs","line":33,"policy":"sample-policy"}
{"uid":"1299d386-525b-4032-98ae-1949f69f9cfc","allowed":false,"status":{"message":"Nops! You cannot do that!","details":{"causes":[{"reason":null,"message":"Privileged container is not allowed","field":null}]}},"auditAnnotations":null,"warnings":null}
```

## GSoC Update: JavaScript SDK Enhancements

This month also saw great enhancements to our JavaScript SDK. A big thank you
to [**Esosa**](https://github.com/esosaoh), our GSoC mentee!

Esosa is focused on making the SDK stable and production-ready. He has
introduced a significant number of new host capabilities and improved the
codebase, paving the way for a public release. With that in mind, he is now
working on an alpha release of the SDK to validate the full release process and
test it with a template policy.

## Policy Fixes

We recently received a
[request](https://github.com/kubewarden/rego-policies-library/issues/50) from
the community to implement an additional validation in one of our Rego
policies. The **Kustomization Target Namespace** policy, which validates FluxCD
Kustomizations, now ensures that the optional `spec.targetNamespace` field is
set to one of the allowed namespaces. Prior to this change, requests were
accepted even if this field was not set.

## SBOM Generation Update and maintenance tasks

In this release, beyond the usual dependency updates and maintenance work,
we've removed all references to the deprecated
[spdx-sbom-generator](https://github.com/opensbom-generator/spdx-sbom-generator)
tool. All our GitHub Actions now use [Syft](https://github.com/anchore/syft) to
generate SBOM files. The generated files are slightly different due to the
change in tooling, but users should not be concerned, the files are
equivalent.

## Getting in touch

Join the conversation on
[Slack](https://kubernetes.slack.com/?redir=%2Fmessages%2Fkubewarden) or
[GitHub discussions](https://github.com/orgs/kubewarden/discussions) and let us
know how you’re using Kubewarden 1.27!
