---
title: Introducing the AdmissionPolicy
authors:
- Raul Cabello Martin
date: 2022-03-16
lastmod: 2022-03-29
---

Up till now, the only way to define a policy in Kubewarden was to use the [`ClusterAdmissionPolicy`](https://github.com/kubewarden/kubewarden-controller/blob/main/docs/crds/README.asciidoc#k8s-api-github-com-kubewarden-kubewarden-controller-apis-policies-v1alpha2-clusteradmissionpolicy) resource that would be applied to cluster-wide resources across all namespaces.

That's why we're thrilled to announce the new `AdmissionPolicy` resource. This new resource is created inside a `namespace` and the policies will only process the requests that are targeting the namespace where the `AdmissionPolicy` is defined. Except from being a "namespaced" resource, `AdmissionPolicy` works exactly the same as the `ClusterAdmissionPolicy`.

## Why should you use AdmissionPolicies?

It was possible to restrict the namespaces where a `ClusterAdmissionPolicy` evaluated resources using a [`namespaceSelector`](https://github.com/kubewarden/kubewarden-controller/blob/main/docs/crds/README.asciidoc#clusteradmissionpolicyspec). However there was no way for Kubernetes administrators to restrict users from creating `ClusterAdmissionPolicies` that evaluate resources just in a particular namespace. 

Moreover, allowing all tenants to deploy `ClusterAdmissionPolicies` is risky. A tenant could apply policies that affect resources in all namespaces, even if they don't have access to all of them.
Which is why, as a Kubernetes administrator, you probably want to allow tenants to deploy policies only in the namespaces they have access to. That's where `AdmissionPolicies` come into play! `AdmissionPolicies` combined with [Role-Based Access Control (RBAC) in Kubernetes](https://kubernetes.io/docs/reference/access-authn-authz/rbac/) allow you to enforce this restriction by delimiting the tenants to deploy resources only across namespaces they have access to.

As an example, let's say you want a tenant who can deploy resources just to the `development` namespace. You can allow this tenant to deploy `AdmissionPolicies` just in this namespace using RBAC. However, if you allowed them to create `ClusterAdmissionPolicies`, they could block other resources from being handled in other namespaces.

## AdmissionPolicy in Action!

Let's create an `AdmissionPolicy` that rejects privileged pods from being created in the `production` namespace.
For this example, a Kubernetes cluster with Kubewarden already installed is required. The installation process is described in the [quick start guide](https://docs.kubewarden.io/quick-start.html).

First, create two namespaces: `development` and `production`

```
kubectl create ns development 
kubectl create ns production
```

Once the namespaces are created, create a new `AdmissionPolicy` resource in the `production` namespace:

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

Wait for the policy to be active:

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

Try to create a privileged pod in the `production` namespace:
```
kubectl apply -f privileged-pod.yaml -n production
```

You will get the following error:

```
Error from server: error when creating "privileged-pod.yaml": admission webhook "namespaced-kubewarden-privileged-pods.kubewarden.admission" denied the request: User 'my-user' cannot schedule privileged containers
```

Finally, verify you can successfully create a privileged pod in a different namespace:

```
kubectl apply -f privileged-pod.yaml -n development
```

## Conclusion

As evidenced in the above example, Kubewarden provides you with two different choices for deploying policies.

If your policy needs to be applied to resources across all namespaces or cluster-wide resources, then you can use `ClusterAdmissionPolicies`. 

On the other hand, if your cluster is shared by multiple users or teams, uses different namespaces or your policy needs to be applied only to resources within a namespace, then the new `AdmissionPolicy` would be the right choice.

You can find the `AdmissionPolicy` specification [here](https://github.com/kubewarden/kubewarden-controller/blob/e0433fc3774d06dcf5e08bf2c600ad0117b89448/docs/crds/README.asciidoc#admissionpolicy).

As a community, we thrive on feedback and welcome your suggestions! Feel free to open an issue against our
[GitHub repository](https://github.com/kubewarden/kubewarden-controller) or get in
touch on the [#kubewarden Slack channel](https://kubernetes.slack.com/archives/C01T3GTC3L7)!

