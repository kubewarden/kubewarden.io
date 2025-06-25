---
title: "Kubewarden 1.26 Release"
authors:
  - Víctor Cuadrado Juan
date: 2025-06-25
---

Kubewarden 1.26 is fresh out of the oven, with a nice bunch of features.

## Running policies from YAML locally with kwctl

Up until now, to run policies with `kwctl run` one needed to pass the policy
module URL, the settings, and the context-aware settings via
specific flags. For example:

```console
$ kwctl run \
        --settings-json '{"allowPorts": [80], "denyPorts": [3000]}' \
        --request-path req_pod_with_allowed_capabilities_accept.json \
        registry://ghcr.io/kubewarden/policies/ingress:v0.1.8
```

Thanks to suggestions from our user community, `kwctl` now can consume a YAML
file containing the Custom Resource Definition of policies, and run the request
against them. Using this run mode, `kwctl` evaluates not only 1 policy, but
each policy in the file using the same request.

Moreover, it's now possible to run ["policy
groups"](https://docs.kubewarden.io/explanations/policy-groups) policies using
`kwctl` too! 🥳

For example, with the following definition of 2 policies:

```yaml
# policies.yaml
---
apiVersion: policies.kubewarden.io/v1
kind: ClusterAdmissionPolicy
metadata:
  name: safe-labels
spec:
  module: registry://ghcr.io/kubewarden/policies/safe-labels:v1.0.2
  rules:
    - apiGroups: [""]
      apiVersions: ["v1"]
      operations: ["CREATE"]
      resources: ["namespaces"]
  settings:
    denied_labels:
      - cost-center
---
apiVersion: policies.kubewarden.io/v1
kind: ClusterAdmissionPolicy
metadata:
  name: capabilities-psp
spec:
  module: registry://ghcr.io/kubewarden/policies/capabilities-psp:v1.0.2
  rules:
    - apiGroups: [""]
      apiVersions: ["v1"]
      operations: ["CREATE", "UPDATE"]
      resources: ["pods"]
  settings:
    allowed_capabilities:
      - CHOWN
    required_drop_capabilities:
      - NET_ADMIN
```

We can run a request locally with kwctl:

```console
$ kwctl run policies.yaml --request-path req_pod_with_allowed_capabilities_accept.json

  Successfully pulled policy from registry://ghcr.io/kubewarden/policies/safe-labels:v1.0.2
  Successfully pulled policy from registry://ghcr.io/kubewarden/policies/capabilities-psp:v1.0.2                                                                                                                                                                                                                                2025-06-25T12:25:57.144579Z  WARN kwctl::command::run: Multiple policies defined inside of the CRD file. All of them will run sequentially using the same request.
{"uid":"f0b8fba3-4f4f-465b-af8c-84d0326a2dc2","allowed":true,"auditAnnotations":null,"warnings":null}
{"uid":"f0b8fba3-4f4f-465b-af8c-84d0326a2dc2","allowed":true,"patchType":"JSONPatch","patch":"W3sib3AiOiJhZGQiLCJwYXRoIjoiL2FwaVZlcnNpb24iLCJ2YWx1ZSI6InYxIn0seyJvcCI6ImFkZCIsInBhdGgiOiIva2luZCIsInZhbHVlIjoiUG9kIn0seyJvcCI6ImFkZCIsInBhdGgiOiIvc3BlYy9jb250YWluZXJzLzAvc2VjdXJpdHlDb250ZXh0L2NhcGFiaWxpdGllcy9kcm9wIiwidmFsdWUiOlsiTkVUX0FETUlOIl19XQ==","auditAnnotations":null,"warnings":null}
```

In this run mode, only the following attributes of the Custom Resource
Definition (CRD) are evaluated:

- Policy module
- Policy settings
- Context-aware resources the policy can access

Other fields, such as rules, `matchConditions`, `objectSelector`, and
`namespaceSelector`, are ignored, as they cannot be applied out of cluster.

You can read about this by performing a `kwctl run --help` or by reading our
[reference docs](https://docs.kubewarden.io/reference/kwctl-cli#kwctl-run) for
kwctl.

## Custom rejection messages

When policies reject operations, cluster operators may want to provide a more
specific rejection message than those provided by policy authors, or even
substitute it, as the message may be hardcoded in some policies.

For example, a cluster operator deploying a
[priority-class](https://artifacthub.io/packages/kubewarden/priority-class-policy/priority-class-policy)
policy to a teams' Namespace might want want to add information on _why_
specific priority classes are disallowed, and which are allowed. The
operator could also redirect the users of that team Namespace to an internal
Wiki documenting all the needed policies. This streamlines administration of
Kubewarden by different personas.

For this use case, we have added a new optional
[`spec.message`](https://docs.kubewarden.io/reference/CRDs#policyspec) to
AdmissionPolicies and ClusterAdmissionPolicies (PolicyGroups and
ClusterPolicyGroups already had the field).

If provided, this new optional `spec.message` field substitutes the original
rejection message from the policy. The original regection message will be
instead available as part of the `.status.details.causes ` field in the
returned `AdmissionResponse` object, which one can read by increasing the
verbosity of `kubectl`.

Let's see a Policy using this new `spec.message` field:

```yaml
apiVersion: policies.kubewarden.io/v1
kind: ClusterAdmissionPolicy
metadata:
  name: pod-privileged-with-message
spec:
  module: registry://ghcr.io/kubewarden/policies/pod-privileged:v1.0.2
  policyServer: default
  mode: protect
  message: "Nops! You cannot do that" # new spec.message
  settings: {}
  rules:
    - apiGroups:
        - ""
      apiVersions:
        - v1
      resources:
        - "*"
      operations:
        - CREATE
  mutating: false
```

When trying this policy, we can see both the original message and the new message,
if we run `kubectl` with enough verbosity:

```console
$ kubectl -v4 run pod-privileged2 --image=registry.k8s.io/pause --privileged
I0612 16:32:43.647601   48424 cert_rotation.go:137] Starting client certificate rotation controller
I0612 16:32:43.662550   48424 helpers.go:246] server response object: [{
  "metadata": {},
  "status": "Failure",
  "message": "admission webhook \"clusterwide-pod-privileged-with-message.kubewarden.admission\" denied the request: Nops! You cannot do that",
  "details": {
    "causes": [
      {
        "message": "Privileged container is not allowed"
      }
    ]
  },
  "code": 400
}]
```

## Documentation: Deployments at scale

A community user of Kubewarden (who desires to be anonymous) has shared with us
how they are making use of Kubewarden in a demanding, large-scale environment
(`~400` nodes, `~10.000` Pods, `~4.000` Namespaces).

You can read about in [our docs](https://docs.kubewarden.io/howtos/deploy-at-scale).

## Bug fixes, minor features and maintenance

### Audit Scanner

The Audit Scanner is configured to run with a default [Service
Account](https://docs.kubewarden.io/explanations/audit-scanner#permissions-and-serviceaccounts),
to be able to scan the Kubernetes clusters and save the results.
Previously, if the default Service Account didn't have the needed permissions
for the specific user usage (for example because the user deployed a more exotic policy),
the Audit Scanner errored and stopped its execution.

Now, the Audit Scanner logs errors when it lacks permissions to access certain
resources, but continues scanning. It also correctly emits errors when starting a scan
of a namespace.

### Port change for policy-server Services

On release 1.23 (March 2025), as part of the hardening of the admission
webhooks, we elected to expose the webhook servers of the policy-servers via a
Service on port 443 to simplify the mTLS configuration, in addition to 8443
(which we internally deprecated).

With 1.26, we are removing the port 8443 on the Services. This is an internal
change and an update will work as expected. Yet if users are manually consuming
policy-server Services, they should expect them on port 443 from now on.

## Rego Policy Catalog SPDX artifacts

In the past, the GitHub Actions that we use for releasing our policies had a bug
when releasing Rego policies from monorepos (like our
[rego-policies-library](https://github.com/kubewarden/rego-policies-library)).
The actions would fail to create release artifacts for those, as they don't
create SPDX artifacts.

This is now solved with
[github-actions](https://github.com/kubewarden/github-actions/releases) v4.5.0,
and Rego policies from monorepos correctly create release artifacts.

# Getting in touch

Join the conversation on
[Slack](https://kubernetes.slack.com/?redir=%2Fmessages%2Fkubewarden) or
[GitHub discussions](https://github.com/orgs/kubewarden/discussions) and let us
know how you’re using Kubewarden 1.26!
