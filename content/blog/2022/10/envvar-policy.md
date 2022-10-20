---
title: Enforcing compliance of container's environment variables
authors:
- José Guilherme Vanz
date: 2022-10-31
---

We're glad to present the new [environment-variable-policy](https://github.com/kubewarden/environment-variable-policy) to Kubewarden users. With this policy, you will now be able to inspect init containers and ephemeral containers. You can also restrict their usage by reviewing the names and values defined under the containers' [`env[*]`](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.22/#envvar-v1-core) field.

As always, the policy can be found in [ArtifactHub](https://artifacthub.io/packages/kubewarden/environment-variable-policy/environment-variable-policy) and all the [artifacts](https://github.com/kubewarden/environment-variable-policy/releases), including the BOM files, are signed with Sigstore.

## What is so useful about the new environment-variable policy?

This policy complements the recently released [env-variable-secrets-scanner](https://www.kubewarden.io/blog/2022/10/env-var-secrets/) policy. Both policies focus on validating the environment values provided to Kubernetes Pod objects. In this new policy, users can validate which variables name and values their resources can have.

The policy controls the environment variable defined in the containers using the four operators described in the next sections.

### anyIn

`anyIn` works as a deny list of your usage of environment variables. It checks if any of the `environmentVariables` are in the Pod/Workload resource:

For example, given the following configuration:

```yaml
settings:
  rules:
    - reject: anyIn
      environmentVariables:
        - name: "foo"
          value: "bar"
        - name: "foo2"
          value: "bar2"
```

The following Pod would be rejected:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx
spec:
  containers:
    - name: nginx
      image: nginx:1.14.2
      ports:
      - containerPort: 80
      env:
        - name: "foo"
          value: "bar"
```

But the next one would be accepted:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx
spec:
  containers:
    - name: nginx
      image: nginx:1.14.2
      ports:
      - containerPort: 80
      env:
        - name: "foo3"
          value: "bar3"
```


### anyNotIn

`anyNotIn` works as an allow list. Checks if any of the `environmentVariables` are not in the Pod/Workload resource:

For example, given the following configuration:

```yaml
settings:
  rules:
    - reject: anyNotIn
      environmentVariables:
        - name: "foo"
          value: "bar"
        - name: "foo2"
          value: "bar2"
```

The following Pod would be rejected:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx
spec:
  containers:
    - name: nginx
      image: nginx:1.14.2
      ports:
      - containerPort: 80
      env:
        - name: "foo"
          value: "bar"
        - name: "foo3"
          value: "bar3"
```

But the next one would be accepted:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx
spec:
  containers:
    - name: nginx
      image: nginx:1.14.2
      ports:
      - containerPort: 80
      env:
        - name: "foo"
          value: "bar"
        - name: "foo2"
          value: "bar2"
```

### allAreUsed

`allAreUsed` the container cannot use all listed environment variables at once. Checks if all of the `environmentVariables` are in the Pod/Workload resource:

For example, given the following configuration:

```yaml
settings:
  rules:
    - reject: allAreUsed
      environmentVariables:
        - name: "foo"
          value: "bar"
        - name: "foo2"
          value: "bar2"
        - name: "foo3"
          value: "bar3"
```

The following Pod would be rejected:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx
spec:
  containers:
    - name: nginx
      image: nginx:1.14.2
      ports:
      - containerPort: 80
      env:
        - name: "foo"
          value: "bar"
        - name: "foo2"
          value: "bar2"
        - name: "foo3"
          value: "bar3"
```

But the next one would be accepted:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx
spec:
  containers:
    - name: nginx
      image: nginx:1.14.2
      ports:
      - containerPort: 80
      env:
        - name: "foo"
          value: "bar"
        - name: "foo3"
          value: "bar3"
```



### notAllAreUsed

`notAllAreUsed` the container can use all listed environment variables at once. But it cannot has only a subset of them.
Checks if all of the `environmentVariables` are not in the Pod/Workload resource

For example, given the following configuration:

```yaml
settings:
  rules:
    - reject: notAllAreUsed
      environmentVariables:
        - name: "foo"
          value: "bar"
        - name: "foo2"
          value: "bar2"
```

The following Pod would be rejected:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx
  spec:
    containers:
    - name: nginx
      image: nginx:1.14.2
      ports:
      - containerPort: 80
      env:
        - name: "foo"
          value: "bar"
```

But the next one would be accepted:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx
spec:
  containers:
    - name: nginx
      image: nginx:1.14.2
      ports:
      - containerPort: 80
      env:
        - name: "foo"
          value: "bar"
        - name: "foo2"
          value: "bar2"
```

## Using multiple rules

The user is allowed to define multiple rules in the policy settings. The resource must be approved by all of them in order to be accepted into the cluster.
Let's take a look in an example. Consider the following rules:

```console
kubectl apply -f - <<EOF
apiVersion: policies.kubewarden.io/v1
kind: ClusterAdmissionPolicy
metadata:
  name: environment-variable-policy
spec:
  module: ghcr.io/kubewarden/policies/environment-variable-policy:v0.1.1
  mutating: false
  rules:
  - apiGroups: ["apps"]
    apiVersions: ["v1"]
    resources: ["deployments"]
    operations:
    - CREATE
    - UPDATE
  settings:
    rules:
      - reject: anyIn
        environmentVariables:
          - name: "foo"
            value: "bar"
          - name: "foo2"
            value: "bar2"
      - reject: allAreUsed
        environmentVariables:
          - name: "foo3"
            value: "bar3"
          - name: "foo4"
            value: "bar4"
EOF
```

The following two `Deployments` will be rejected. The first one will be rejected by the first rule:

```console
kubectl apply -f - <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
  labels:
    app: nginx
spec:
  replicas: 1
  selector:
    matchLabels:
      app: template-nginx
  template:
    metadata:
      labels:
        app: template-nginx
    spec:
      containers:
      - name: nginx
        image: nginx:1.14.2
        ports:
        - containerPort: 80
        env:
          - name: "foo"
            value: "bar"
EOF
Error from server: error when creating "STDIN": admission webhook "clusterwide-environment-variable-policy.kubewarden.admission" denied the request: Resource cannot define any of the environment variables from the rule.
```

The second `Deployment`  will be reject by the second rule:

```console
kubectl apply -f - <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
  labels:
    app: nginx
spec:
  replicas: 1
  selector:
    matchLabels:
      app: template-nginx
  template:
    metadata:
      labels:
        app: template-nginx
    spec:
      containers:
      - name: nginx
        image: nginx:1.14.2
        ports:
        - containerPort: 80
        env:
          - name: "foo3"
            value: "bar3"
          - name: "foo4"
            value: "bar4"
EOF
Error from server: error when creating "STDIN": admission webhook "clusterwide-environment-variable-policy.kubewarden.admission" denied the request: Resource cannot have all the environment variables from the rule defined.
```

But when we try to deploy a resource that respects both rules, it will be created with no issues:

```console
kubectl apply -f - <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
  labels:
    app: nginx
spec:
  replicas: 1
  selector:
    matchLabels:
      app: template-nginx
  template:
    metadata:
      labels:
        app: template-nginx
    spec:
      containers:
      - name: nginx
        image: nginx:1.14.2
        ports:
        - containerPort: 80
        env:
          - name: "foo3"
            value: "bar3"
EOF
deployment.apps/nginx-deployment created
```


## A use case example

Let's see how users can enforce that their resources have a minimum set of required environment variables. For that, it possible to use the `allAreUsed` operator:

```console
kubectl apply -f - <<EOF
apiVersion: policies.kubewarden.io/v1
kind: ClusterAdmissionPolicy
metadata:
  name: environment-variable-policy
spec:
  module: ghcr.io/kubewarden/policies/environment-variable-policy:v0.1.1
  mutating: false
  rules:
  - apiGroups: ["apps"]
    apiVersions: ["v1"]
    resources: ["deployments"]
    operations:
    - CREATE
    - UPDATE
  settings:
    rules:
      - reject: anyIn
        environmentVariables:
          - name: "foo"
            value: "bar"
          - name: "foo2"
            value: "bar2"

EOF
```

With the above policy only resources that have **all** the variables defined in the `environmentVariables` field will be allowed.

Now try to deploy a resource that violates that rule:


```console
kubectl apply -f - <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
  labels:
    app: nginx
spec:
  replicas: 1
  selector:
    matchLabels:
      app: template-nginx
  template:
    metadata:
      labels:
        app: template-nginx
    spec:
      containers:
      - name: nginx
        image: nginx:1.14.2
        ports:
        - containerPort: 80
        env:
          - name: "foo"
            value: "bar"
EOF
Error from server: error when creating "STDIN": admission webhook "clusterwide-environment-variable-policy.kubewarden.admission" denied the request: Resource cannot define any of the environment variables from the rule.
```


## Summary

We hope this article provided you a nice overview about the potential use cases of this policy and how to use it.
Give it a try and, as usual, we look forward to your feedback :).

Have ideas for new policies?  Would you like more features on existing ones?
Drop us a line at [#kubewarden on Slack](https://kubernetes.slack.com/archives/C01T3GTC3L7)!
