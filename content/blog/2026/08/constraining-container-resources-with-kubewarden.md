---
title: "Constraining Container Resources with Kubewarden"
authors:
  - Dan Čermák
  - John Krug
date: 2026-08-31
---
# Constraining Container Resources with Kubewarden

Kubewarden is a policy framework for Kubernetes that helps you set up tighter
guardrails for your Kubernetes cluster. Policies allow you to restrict
deployments on your cluster in many ways, like:

* control the container images that are used
* permit only certain users to perform actions
* limit resources that can be assigned to a deployment.

In this tutorial, we cover how to set up Kubewarden and apply a policy providing
boundaries and defaults to container resource limits for pods. You need is a
running Kubernetes cluster (for example, k3s) and Helm to get started!


## Install Kubewarden Admission Controller

The easiest way to install Kubewarden’s Admission controller is using Helm:

```bash
helm repo add kubewarden https://charts.kubewarden.io
helm repo update kubewarden
helm install --wait \
             --timeout 5m \
             --namespace kubewarden \
             --create-namespace admission-controller \
                 kubewarden/admission-controller
```

You then verify that Kubewarden is set up, by checking the deployments in the
`kubewarden` namespace:

```ShellSession
# kubectl get deployments -n kubewarden
NAME                    READY   UP-TO-DATE   AVAILABLE   AGE
admission-controller    1/1     1            1           18h
policy-server-default   1/1     1            1           18h
```

## Container-Resources Policy

When deploying applications on Kubernetes, you can define limits and set default
values for requested resources, like CPU and memory. As an organization
administrator, you might want to control the defaults and the limits that your
operators set, when creating their deployments. Otherwise, a single application
could be created with excessive or no limits at all, consuming all available
resources.

Kubewarden’s
[`container-resources`](https://artifacthub.io/packages/kubewarden/kubewarden-policy-library/container-resources)
policy allows you to set defaults and for requested CPU and memory and
constraint the limits to both resources.

## Example constraint policy

You start by creating a namespace for our experiments, so it's easy to clean it
up later:

```ShellSession
# kubectl create namespace container-resources-demo
namespace/container-resources-demo created
```

The policy itself is written in standard Kubernetes yaml. A minimal example
follows:

```yaml
apiVersion: policies.kubewarden.io/v1
kind: ClusterAdmissionPolicy
metadata:
  name: container-resources-policy
  namespace: container-resources-demo

spec:
  policyServer: default
  module: registry://ghcr.io/kubewarden/policies/container-resources:latest
  mutating: true
  failurePolicy: Fail
  namespaceSelector:
    matchLabels:
      kubernetes.io/metadata.name: container-resources-demo

  rules:
    - apiGroups: [""]
      apiVersions: ["v1"]
      resources: ["pods"]
      operations:
        - CREATE
        - UPDATE

  settings:
    memory:
      defaultRequest: "1G"
      defaultLimit: "2G"
      maxLimit: "4G"
      maxRequest: "2G"
      minRequest: "500M"
      minLimit: "2G"
    cpu:
      defaultRequest: 1
      defaultLimit: 2
      maxLimit: 3
      maxRequest: 1.5
      minRequest: 0.5
      minLimit: 1.5
```

Let’s unpack this first, before trying to apply the policy. The policy consists
of the following blocks:

1. Standard header for the
   [ClusterAdmissionPolicy](https://docs.kubewarden.io/admission-controller/latest/en/reference/CRDs.html)
   resource, including our test namespace.
2. spec section defining where to obtain the policy from with
3. rules defines for which API groups the policy is applied to and which
   operations it can cover. Your policy applies only to create & update
   operations for pods.
4. The policy settings itself.

The container-resources policy allows you to specify the request (minimum
guaranteed) and limit (maximum allowed) for CPU and memory for the default,
maximum and minimum. In the above example, every pod will be assigned 1GB of
memory by default and the requested memory must stay in the bounds of 500MB and
2GB.  Note, that the following rule applies to the values of both CPU and memory
limit and request:
```
minRequest <= defaultRequest <= maxRequest <= minLimit <= defaultLimit <= maxLimit
```

Apply the aforementioned policy, by writing it into `/tmp/policy.yaml` and
running:

```ShellSession
# kubectl apply -f /tmp/policy.yaml
clusteradmissionpolicy.policies.kubewarden.io/container-resources-policy created
```

The cluster now reports that the policy has now been created, but it is not
active yet. It is advisable to wait for it to become active, for example, using:

```ShellSession
# kubectl wait --for=condition=PolicyActive=True \
      clusteradmissionpolicy/container-resources-policy --timeout=120s
clusteradmissionpolicy.policies.kubewarden.io/container-resources-policy condition met
```

You can proceed, once the policy is active. A first step would be to create a
non-compliant pod, that gets rejected by the policy:

```ShellSession
# kubectl apply -f - <<'EOF'
apiVersion: v1
kind: Pod
metadata:
  name: too-low-limit-test
  namespace: container-resources-demo
spec:
  containers:
    - name: web
      image: registry.suse.com/suse/nginx:latest
      resources:
        requests:
          cpu: "300m"
          memory: "256Mi"
        limits:
          cpu: "3"
          memory: "1Gi"
EOF
Error from server: error when creating "STDIN": admission webhook "kw.cap.container-resources-policy.kubewarden.admission" denied the request: memory limit '1Gi' doesn't reach the min allowed value '2G'
```

With this policy active Kubewarden rejects the pod, as its limit is below the
minimum of 2G.

### Additional Resource Constraint Policy Features

The `container-resources` policy does not require you to provide all values for
all resource limits and requests, you can omit them and the policy will treat
them as not configured. It might be useful to require a *resource limit and
request to be defined*, irrespective of its actual value. You can achieve this
with the following policy:

```yaml
apiVersion: policies.kubewarden.io/v1
kind: ClusterAdmissionPolicy
metadata:
  name: container-resources-policy
  namespace: container-resources-demo

spec:
  policyServer: default
  module: registry://ghcr.io/kubewarden/policies/container-resources:latest
  mutating: true
  failurePolicy: Fail
  namespaceSelector:
    matchLabels:
      kubernetes.io/metadata.name: container-resources-demo

  rules:
    - apiGroups: [""]
      apiVersions: ["v1"]
      resources: ["pods"]
      operations:
        - CREATE
        - UPDATE

  settings:
    memory:
      ignoreValues: true
    cpu:
      ignoreValues: true
```

This policy results in pods without explicit limits being rejected, while any
set value is accepted:

```ShellSession
# kubectl apply -f - <<'EOF'
apiVersion: v1
kind: Pod
metadata:
  name: no-limit-test
  namespace: container-resources-demo
spec:
  containers:
    - name: web
      image: registry.suse.com/suse/nginx:latest
EOF
Error from server: error when creating "STDIN": admission webhook "kw.cap.container-resources-policy.kubewarden.admission" denied the request: container does not have any resource limits

# kubectl apply -f - <<'EOF'
apiVersion: v1
kind: Pod
metadata:
  name: insane-limit-test
  namespace: container-resources-demo
spec:
  containers:
    - name: web
      image: registry.suse.com/suse/nginx:latest
      resources:
        requests:
          cpu: "4"
          memory: "6Gi"
        limits:
          cpu: "6"
          memory: "12Gi"
EOF
pod/insane-limit-test created
```

Another useful feature is the ability to exempt certain images from the resource
limits with the ignoreImages list. This is a list of container image URLs, which
are exempt from the policy. It supports string matching using `*` as a wild
card. Use carefully to avoid accidentally exempting another similarly named
image.  You can create a policy, where limits apply, except for an image that
can request arbitrarily high limits (or none at all):

```yaml
apiVersion: policies.kubewarden.io/v1
kind: ClusterAdmissionPolicy
metadata:
  name: container-resources-policy
  namespace: container-resources-demo

spec:
  policyServer: default
  module: registry://ghcr.io/kubewarden/policies/container-resources:latest
  mutating: true
  failurePolicy: Fail
  namespaceSelector:
    matchLabels:
      kubernetes.io/metadata.name: container-resources-demo

  rules:
    - apiGroups: [""]
      apiVersions: ["v1"]
      resources: ["pods"]
      operations:
        - CREATE
        - UPDATE

  settings:
    memory:
      defaultLimit: "2G"
      maxLimit: "4G"
      minLimit: "1G"
    ignoreImages:
      - "registry.suse.com/suse/nginx:*"
```

This policy allows creating a nginx pod with arbitrary memory limits, while all
other images must comply with the specified limits:

```ShellSession
# kubectl apply -f - <<'EOF'
apiVersion: v1
kind: Pod
metadata:
  name: insane-limit-test
  namespace: container-resources-demo
spec:
  containers:
    - name: web
      image: registry.suse.com/suse/nginx:latest
      resources:
        limits:
          cpu: "6"
          memory: "12Gi"
EOF
pod/insane-limit-test created

# kubectl apply -f - <<'EOF'
apiVersion: v1
kind: Pod
metadata:
  name: insane-limit-test2
  namespace: container-resources-demo
spec:
  containers:
    - name: web
      image: registry.suse.com/suse/tomcat:latest
      resources:
        limits:
          cpu: "6"
          memory: "12Gi"
EOF
Error from server: error when creating "STDIN": admission webhook "kw.cap.container-resources-policy.kubewarden.admission" denied the request: memory limit '12Gi' exceeds the max allowed value '4G'
```

### Debugging Policy Problems

The Admission Controller validates your policy settings after it has been
applied. So you can apply a policy that is invalid (for example, because the
defaultRequest is higher than the defaultLimit) and that consequently fails to
deploy. You will *not notice this* when only running kubectl apply, you should
always check whether the policy has been deployed using `kubectl get
clusteradmissionpolicy container-resources-policy`:

```ShellSession
# kubectl get clusteradmissionpolicy container-resources-policy -o jsonpath='{.status.policyStatus}{"\n"}'
active
```

If a policy fails to deploy, then its status will stay pending
indefinitely. Check the logs from the kubewarden policy server to find out what
went wrong:

```
# kubectl logs -n kubewarden -l kubewarden/policy-server=default
2026-08-31T10:08:37.320566Z  INFO validate_settings{self=PolicyEvaluator { runtime: "wapc" } settings=PolicySettings({"memory": Object {"defaultLimit": String("1G"), "defaultRequest": String("2G")}})}:policy_log{self=EvaluationContext { policy_id: "kw.cap.container-resources-policy", callback_channel: Some(...), allowed_kubernetes_resources: {}, host_capabilities: [*] }}: policy_log: validating settings data={}
Error: Policy settings are invalid: Provided settings are not valid: invalid memory settings
default request: 2G cannot be greater than default limit: 1G
```

Here the error is in the last line, you set a request that is higher than the
limit. You can fix this by either patching the policy, or by deleting and
re-creating it.

## Next Steps

You have learned how to apply constraints to resource limits and requests for
pods. But `deployments` and `daemonsets` are still unconstrained. A potential
next step would be to extend the policy rules to also cover additional
resources.

Lastly you can delete the whole namespace to clean up after your experiments using
`kubectl delete namespace container-resources-demo`.
