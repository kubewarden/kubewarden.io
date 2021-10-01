---
title: A new architecture to ease Kubewarden administrators' lives
authors:
    - Víctor Cuadrado Juan
date: 2021-10-01
---

We are pleased to announce a new architecture for the Kubewarden stack, in line
with its journey to maturity:

The introduction of a **PolicyServer** Custom Resource Definition (CRD) which
allows users to describe a policy-server Deployment, together with binding
**ClusterAdmissionPolicies** to a specific **PolicyServer** instance.

These 2 changes are accompanied by a multitude of improvements to make Kubewarden
more comfortable for Kubernetes Administrators, such as validation for
Kuberwarden Custom Resources, improvements in Helm Charts, Status and
Conditions for **ClusterAdmissionPolicies**.

For a comprehensive list, see the [release notes](TODO) of our latest Helm
charts.

## How does it look like?

In previous versions, the Kubewarden Controller instantiated a single Deployment
of policy-server. That policy-server was configured via a ConfigMap, which
contained the Deployment options (image, replicas, ...), and a list of policies to
load compiled from the instantiated ClusterAdmissionPolicies, with information
on where to pull them from, their configuration options and so on.

With the addition of the new **PolicyServer** Custom Resource, administrators
have a better UX, since they can define as many policy servers as they need, and
get to select what PolicyServer each ClusterAdmissionPolicy targets. Let's see a
diagram of the new architecture:

{{< figure class="center" src="/images/how-it-works-kubewarden.svg" width="90%" alt="new architecture diagram">}}

On the diagram, notice the 2 separate PolicyServer Deployments in cyan and mauve
(right), created as specified in the 2 PolicyServer resources (left).

Each policy server loads different policies -- all ClusterAdmissionPolicies that
target that specific policy server. The new PolicyServer Custom Resource is
cluster-wide, which means that is identifiable by its unique `name`. Here is an
example of a PolicyServer named `tenant-a`:

```yaml
---
apiVersion: policies.kubewarden.io/v1alpha2
kind: PolicyServer
metadata:
  name: tenant-a
spec:
  image: ghcr.io/kubewarden/policy-server:v0.1.10
  replicas: 1
```

A ClusterAdmissionPolicy targeting that PolicyServer needs to set
`spec.policyServer` to `tenant-a`, as such:

```yaml
---
apiVersion: policies.kubewarden.io/v1alpha2
kind: ClusterAdmissionPolicy
metadata:
  name: psp-capabilities
spec:
  policyServer: tenant-a
  module: registry://ghcr.io/kubewarden/policies/psp-capabilities:v0.1.3
  rules:
    - apiGroups: [""]
      apiVersions: ["v1"]
      resources: ["pods"]
      operations:
        - CREATE
        - UPDATE
  mutating: true
  settings:
    allowed_capabilities:
      - CHOWN
    required_drop_capabilities:
      - NET_ADMIN
```

For a more in depth dive, have a look at our [architecture
docs](https://docs.kubewarden.io/architecture.html), and the [Kubewarden CRDs documentation](https://github.com/kubewarden/kubewarden-controller/blob/main/docs/crds/README.asciidoc).

## Ok, but what does this mean for administrators?

Moving from 1 PolicyServer to several increases resiliency and segregation. Now,
we can take admission reviews from policies and separate them into several
PolicyServers. While the old architecture was already HA, a noisy
tenant/namespace or a frequently used policy could bring to a crawl the only
policy server and break havoc in the Cluster.

With the new possibility of several PolicyServers, a Kubernetes Operator can
isolate policy evaluations per tenant/namespace, and run mission critical
policies separately, making the whole infrastructure more resilient.

The new architecture also validates and mutates PolicyServers and
ClusterAdmissionPolicies with dedicated admission controllers, for a better UX.
Which means that administrators can rest comfortably when editing them, as
catastrophic outcomes (such as all policies being dropped by a misconfigured
PolicyServer, leading to DOS against the cluster) can never happen. Also,
ClusterAdmissionPolicies will, if no `spec.policyServer` is defined, bind to the
PolicyServer named `default`. In addition,
[Finalizers](https://kubernetes.io/docs/concepts/overview/working-with-objects/finalizers/)
are now added to all Kubewarden Custom Resources, which ensure orderly deletion
by the Kubewarden Controller.

The inclusion of validating and mutating webhooks for Kuberwarden CRDs means that
the controller webhook server needs to be securely hooked up to the Kubernetes
API. In this case, it means using TLS certificates. We have chosen to integrate
Kuberwarden with [cert-manager](https://cert-manager.io/), to simplify the
installation, and our Helm Chart today comes with the option for automatically
creating and setting up Self-Signed certs, or using your own cert-manager
Issuer.

For ease of deployment, we have separated the CRDs into its own Helm chart:
`kubewarden-crds`. This prepares the stack for smoother upgrades in the future.
The Kubewarden Controller and default policy server stay in the
`kubewarden-controller` Helm chart.

All of the new changes simplify managing clusters. Which makes Kubewarden use
via [Fleet](https://fleet.rancher.io/) more consistent and streamlined.

## A hands-on example

Let's install Kubewarden and secure our cluster against privileged pods with a
simple policy.

### Installing Kubewarden

Follow this example:
```console
$ kubectl apply -f https://github.com/jetstack/cert-manager/releases/download/v1.5.3/cert-manager.yaml
$ kubectl wait --for=condition=Available deployment --timeout=2m -n cert-manager --all
$ helm repo add kubewarden https://charts.kubewarden.io
$ helm install --create-namespace -n kubewarden kubewarden-crds kubewarden/kubewarden-crds
$ helm install --wait -n kubewarden kubewarden-controller kubewarden/kubewarden-controller
```

This will install [cert-manager](https://cert-manager.io), a dependency of
Kubewarden, and then install the `kubewarden-crds` and `kubewarden-controller`
Helm charts in the default configuration (which includes self-signed TLS certs).
Shortly after, you will have the Kubewarden Controller running and one
PolicyServer, named `default`, on the `kubewarden` namespace:


```console
$ kubectl get policyservers
NAME      AGE
default   38s
```

The default configuration values should be good enough for the majority of
deployments (all options are documented [here](https://charts.kubewarden.io/#configuration)).

Now, you can use Kubewarden, with Go, Rust, Swift, Open Policy Agent and
Gatekeeper policies, as you are used to.

Let's deploy our own policy-server named `my-policy-server`, and a Kubewarden
Policy based on the
[pod-privileged](https://github.com/kubewarden/pod-privileged-policy) policy, to
be scheduled in that specific policy-server:

```console
$ kubectl apply -f - <<EOF
---
apiVersion: policies.kubewarden.io/v1alpha2
kind: ClusterAdmissionPolicy
metadata:
  name: privileged-pods
spec:
  policyServer: my-policy-server
  module: registry://ghcr.io/kubewarden/policies/pod-privileged:v0.1.9
  rules:
    - apiGroups: [""]
      apiVersions: ["v1"]
      resources: ["pods"]
      operations:
        - CREATE
        - UPDATE
  mutating: false
---
apiVersion: policies.kubewarden.io/v1alpha2
kind: PolicyServer
metadata:
  name: my-policy-server
spec:
  image: ghcr.io/kubewarden/policy-server:v0.1.10
  replicas: 1
EOF
```

```console
$ kubectl get policyservers
NAME               AGE
default            1m12s
my-policy-server   29s
```

While the new Deployment for the new PolicyServer is still being deployed, the
policy will be marked as `unschedulable`, and move to `pending` once we are
waiting for the PolicyServer to accept connections:

```console
$ kubectl get clusteradmissionpolicies
NAME              POLICY SERVER      MUTATING   STATUS
privileged-pods   my-policy-server   false      pending
```

We can wait some seconds for the policy server to be up, and the policy to be active:
```console
$ kubectl wait --for=condition=PolicyActive clusteradmissionpolicy/privileged-pods
clusteradmissionpolicy.policies.kubewarden.io/privileged-pods condition met

$ kubectl get clusteradmissionpolicies
NAME              POLICY SERVER      MUTATING   STATUS
privileged-pods   my-policy-server   false      active
```

Now if we try to create a Pod with at least one privileged container, it will
not be allowed:

```console
$ kubectl apply -f - <<EOF
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
EOF

Error from server: error when creating "STDIN": admission webhook "privileged-pods.kubewarden.admission" denied the request: User 'youruser:yourrole' cannot schedule privileged containers
```

# Foreword

The new Kubewarden stack, with the new cluster-wide PolicyServer resource,
allows fine-tuning of policies, and at the same time makes the life of
administrators easier with CR validations, workflow simplifications, and
separation of concerns.

We hope you enjoy Kubewarden. We have many ideas about how to expand and improve
the project, and we would like to hear what you would like to see in the
future: don't hesitate to open an issue in any of the
[github.com/kubewarden](https://github.com/kubewarden) projects or get in
contact in the [#kubewarden Slack channel](https://kubernetes.slack.com/archives/C01T3GTC3L7)!

Stay tuned for more!
