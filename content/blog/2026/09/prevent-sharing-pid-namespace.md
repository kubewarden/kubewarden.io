---
title: "Preventing containers from sharing the PID namespace with Kubewarden"
authors:
  - Dan Čermák
date: 2026-09-03
---

## The PID namespace

A container consists of one or more processes on the host. Kernel primitives,
such as namespaces, isolate these processes. A process in a PID (process ID)
namespace can see processes in the same namespace and its descendants, but
nothing outside of the namespace. For containers, this isolation prevents
processes in one container from seeing or interacting with processes in other
containers or on the host.

To test the impact of missing PID isolation, try to disable it in Docker or
Podman using the `--pid=host` flag:

```ShellSession
❯ podman run registry.opensuse.org/opensuse/tumbleweed:latest ps aux
USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
root           1  0.0  0.0   5732  3480 ?        Rs   15:58   0:00 ps aux

❯ podman run --pid=host registry.opensuse.org/opensuse/tumbleweed:latest ps aux
USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
# long output of all host processes omitted
```

Kubernetes supports a similar option for Pods. By default, every container in a
Pod has its own PID namespace. With the `shareProcessNamespace: true` setting,
all containers in a Pod share the same PID namespace but cannot see host
processes. Create a Pod with two sleeping containers to test this behavior:

```ShellSession
❯ kubectl apply -f - <<'EOF'
apiVersion: v1
kind: Pod
metadata:
  name: shared-pid
spec:
  shareProcessNamespace: true

  containers:
    - name: app
      image: registry.opensuse.org/opensuse/busybox:latest
      command:
        - sh
        - -c
        - exec sleep 99999

    - name: shell
      image: registry.opensuse.org/opensuse/busybox:latest
      command:
        - sh
        - -c
        - while true; do sleep 3600; done
EOF
```

Verify that each container can view and terminate the other container's
processes:

```ShellSession
❯ kubectl get pods
NAME         READY   STATUS    RESTARTS   AGE
shared-pid   2/2     Running   0          5s
❯ kubectl exec shared-pid -c shell -- ps
PID   USER     TIME  COMMAND
    1 65535     0:00 /pause
    7 root      0:00 sleep 99999
   13 root      0:00 sh -c while true; do sleep 3600; done
   19 root      0:00 sleep 3600
   20 root      0:00 ps
❯ kubectl exec shared-pid -c shell -- kill 7
❯ kubectl get pods
NAME         READY   STATUS    RESTARTS     AGE
shared-pid   2/2     Running   1 (2s ago)   41s
```

Shared PID namespaces also introduce compatibility and security risks. A
container command is no longer PID 1, which can break commands that require to
run as PID 1. Sharing also exposes process information through
`/proc`. Containers in the same Pod may access one another's resources,
including file systems through `/proc/$otherCtrPID/root`.

Delete the test Pod before you continue with `kubectl delete pod shared-pid`.

## Disabling PID namespace sharing

Shared PID namespaces support debugging. To reject workloads that enable this
feature, use Kubewarden's
[`share-pid-namespace-policy`](https://artifacthub.io/packages/kubewarden/kubewarden-policy-library/share-pid-namespace-policy)
policy. Before you continue, install Kubewarden as described in the [Quick Start
Guide](https://docs.kubewarden.io/admission-controller/latest/en/quick-start.html#_installation).

The `share-pid-namespace-policy` rejects Pods that set
`shareProcessNamespace: true`. The policy has no settings. The following policy
defines rules that apply only to Pods:

```yaml
apiVersion: policies.kubewarden.io/v1
kind: ClusterAdmissionPolicy
metadata:
  name: disallow-shared-pid-namespace
spec:
  policyServer: default
  mode: protect

  module: registry://ghcr.io/kubewarden/policies/share-pid-namespace-policy:v1.0.14

  settings: {}

  rules:
    - apiGroups: [""]
      apiVersions: ["v1"]
      resources:
        - pods
      operations:
        - CREATE
        - UPDATE

  mutating: false
  backgroundAudit: true

  message: "Sharing the process namespace between containers is forbidden"
```

Save the policy as `/path/to/policy.yaml` and apply it using `kubectl apply -f
/path/to/policy.yaml`. Verify that the policy is active:

```ShellSession
❯ kubectl get clusteradmissionpolicy \
  disallow-shared-pid-namespace \
  -o jsonpath='{.status.policyStatus}{"\n"}'
active
```

After the policy becomes active, apply the test Pod again:

```ShellSession
❯ kubectl apply -f - <<'EOF'
apiVersion: v1
kind: Pod
metadata:
  name: shared-pid
spec:
  shareProcessNamespace: true

  containers:
    - name: app
      image: registry.opensuse.org/opensuse/busybox:latest
      command:
        - sh
        - -c
        - exec sleep 99999

    - name: shell
      image: registry.opensuse.org/opensuse/busybox:latest
      command:
        - sh
        - -c
        - while true; do sleep 3600; done
EOF
Error from server: error when creating "STDIN": admission webhook "kw.cap.disallow-shared-pid-namespace.kubewarden.admission" denied the request: Sharing the process namespace between containers is forbidden
```

The Kubewarden admission webhook rejects the Pod creation request according to
the policy. The error includes previously defined custom policy message.

## Extending the policy

The initial policy applies to Pods, not Deployments. Kubernetes therefore
accepts the following Deployment:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: shared-pid-deployment
spec:
  replicas: 2
  selector:
    matchLabels:
      app: shared-pid-demo
  template:
    metadata:
      labels:
        app: shared-pid-demo
    spec:
      shareProcessNamespace: true
      containers:
        - name: app
          image: registry.opensuse.org/opensuse/busybox:latest
          command:
            - sh
            - -c
            - exec sleep 99999

        - name: shell
          image: registry.opensuse.org/opensuse/busybox:latest
          command:
            - sh
            - -c
            - while true; do sleep 3600; done
```

Note, that Kubernetes creates the Deployment but does not create its Pods
because the policy blocks them. The situation is less clear, as the Deployment
shows up with zero out of two pods. This can be improved by patching the policy
to reject Deployments and return a clear error message:

```ShellSession
❯ kubectl patch clusteradmissionpolicy disallow-shared-pid-namespace \
  --type='json' \
  -p='[
    {
      "op": "add",
      "path": "/spec/rules/-",
      "value": {
        "apiGroups": ["apps"],
        "apiVersions": ["v1"],
        "resources": ["deployments"],
        "operations": ["CREATE", "UPDATE"]
      }
    }
  ]'
clusteradmissionpolicy.policies.kubewarden.io/disallow-shared-pid-namespace patched
```

Apply the preceding Deployment manifest from
`/tmp/shared-pid-deployment.yaml`. Kubewarden now rejects the request:

```ShellSession
❯ kubectl apply -f /tmp/shared-pid-deployment.yaml
Error from server: error when creating "STDIN": admission webhook "kw.cap.disallow-shared-pid-namespace.kubewarden.admission" denied the request: Sharing the process namespace between containers is forbidden
```

Hint: to not get lost when patching policies, inspect the current policy state,
using `kubectl get clusteradmissionpolicy disallow-shared-pid-namespace -o
yaml`.

If a policy seemingly takes no effect, verify that the policy status is
`active`, not `pending`, using `kubectl get clusteradmissionpolicy
disallow-shared-pid-namespace -o jsonpath='{.status.policyStatus}{"\n"}`.


## Summary

The policy now rejects Pods and Deployments that set `shareProcessNamespace:
true`. As an exercise, extend the policy to apply only to a specific namespace
using a `namespaceSelector`.

After your experiments, delete the test resources:

```bash
kubectl delete pod shared-pid --ignore-not-found
kubectl delete deployment shared-pid-deployment --ignore-not-found
kubectl delete clusteradmissionpolicy disallow-shared-pid-namespace
```
