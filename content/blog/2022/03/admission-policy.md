---
title: Introducing the AdmissionPolicy
authors:
- Raul Cabello Martin
date: 2022-03-09
---

Up until now, the only way to define a policy in Kubewarden was to use a `ClusterAdmissionPolicy`. `ClusterAdmissionPolicies` are applied to matching cluster-wide resources and resources across all namespaces.

We are thrilled to announce `AdmissionPolicy`, a namespaced resource. The policy will process only the requests that are targeting the namespace where the `AdmissionPolicy` is defined. Other than that, there are no functional differences between `AdmissionPolicy` and `ClusterAdmissionPolicy`.

## Understanding the motivation for using AdmissionPolicies

It is possible to restrict the namespaces where a `ClusterAdmissionPolicy` evaluates resources using a `namespaceSelector`, but there is no way for Kubernetes administrators to restrict users from creating `ClusterAdmissionPolicies` that evaluate resources just in a particular namespace. 

Allowing all tenants to deploy `ClusterAdmissionPolicies` is risky. A tenant could apply policies that affect resources in all namespaces, even if they don't have access to all of them.
You probably want to allow tenants to deploy policies just in the namespaces they have access to. That's where `AdmissionPolicies` are useful! We can achieve this restriction with `AdmissionPolicies` and Kubernetes’ Role-Based Access Control (RBAC).

Imagine we have a tenant who can deploy resources just to the `development` namespace. We can allow this tenant to deploy `AdmissionPolicies` just in this namespace using RBAC. If we allowed them to create `ClusterAdmissionPolicies`, they could block other resources from being handled in other namespaces.

## Let's see an AdmissionPolicy in Action!

We are going to create an `AdmissionPolicy` that rejects privileged pods from being created in the `production` namespace.
Assume we have a Kubernetes cluster with Kubewarden installed. Follow the [quick start guide](https://docs.kubewarden.io/quick-start.html) if you don't have Kubewarden installed.

First, create two namespaces: `development` and `production`

```
kubectl create ns development 
kubectl create ns production
```

Let's create an AdmissionPolicy in the `production` namespace:

```yaml
apiVersion: policies.kubewarden.io/v1alpha2
kind: AdmissionPolicy
metadata:
  name: ns-privileged-pods
  namespace: production
spec:
  module: registry://ghcr.io/kubewarden/policies/pod-privileged:v0.1.9
  rules:
  - apiGroups: [""]
    apiVersions: ["v1"]
    resources: ["pods"]
    operations:
    - CREATE
  mutating: false

```

Let's wait for the policy to be active:

```
kubectl wait --for=condition=PolicyActive admissionpolicies ns-privileged-pods -n production
```

Create a file named `privileged-pod.yaml` with the following pod specification:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: privileged-pod
spec:
  containers:
    - name: nginx
      image: nginx:latest
      securityContext:
        privileged: true
```

If we try to create a privileged pod in the `production` namespace:
```
kubectl apply -f privileged-pod.yaml -n production
```

we will get the following error:

```
Error from server: error when creating "privileged-pod.yaml": admission webhook "namespaced-kubewarden-privileged-pods.kubewarden.admission" denied the request: User 'my-user' cannot schedule privileged containers
```

Finally, verify we can successfully create a privileged pod in a different namespace:

```
kubectl apply -f privileged-pod.yaml -n development
```

## Conclusion

Do you want your policy to be applied to resources across all namespaces or cluster-wide resources? Then use `ClusterAdmissionPolicies`. 

Is your cluster shared by multiple users or teams? Are they using different namespaces? Do you want your policy to be applied to resources within a namespace? Then you can now take advantage of the new `AdmissionPolicy`.
You can find the `AdmissionPolicy` specification [here](https://github.com/kubewarden/kubewarden-controller/blob/main/docs/crds/README.asciidoc#admissionpolicy).

We would love to hear your feedback! Feel free to open issues in the
[github.com/kubewarden](https://github.com/kubewarden) projects or get in
touch in the [#kubewarden Slack channel](https://kubernetes.slack.com/archives/C01T3GTC3L7)!

