---
title: Kubewarden 1.16 release
authors:
  - Víctor Cuadrado Juan
date: 2024-08-19
---

# Kubewarden v1.16.0 release

We are thrilled to announce the release of Kubewarden v1.16.0! Following the
northern hemisphere summer, this version packs some goodies but is a bit more
lightweight than usual.

## kwctl scaffold for AdmissionRequests

The `kwctl` cli has learned a new command, `kwctl scaffold admission-request`,
which prints a Kubernetes AdmissionRequest object from the provided Kubernetes
resource definition.

This is useful when developing policies (and not only limited to Kubewarden ones). Now,
you can scaffold the desired AdmissionRequest the policy would receive, and
then end-to-end test a Kubewarden policy against the created AdmissionRequest with
`kwctl run`. For example, here we scaffold a request to create an Ingress object,
which then we use to test one of our policies out of cluster:

```console
$ kwctl scaffold admission-request --operation CREATE \
  --object ingress.yaml > request-ingress.json

2024-08-16T10:32:18.090011Z  INFO kwctl::scaffold::admission_request: Resource catalog not found, building it

$ kwctl run \
  --settings-json '{"constrained_labels": {"owner": ".*"}}' \
  -r request-ingress.json \
  registry://ghcr.io/kubewarden/policies/safe-labels:v0.1.5
```

This new command `kwctl scaffold admission-request` needs to connect to a
Kubernetes APIserver at least for the first time, as some information cannot be
inferred from the resource itself, such as:

- Knowing if the resource is namespaced or not.
- Obtaining the plural name of the resource (e.g: `pods`).

Kwctl caches this information locally for subsequent runs. If the cluster is
still available, it will use it to refresh the cache.

Given that `kwctl` connects to the cluster, it also means that the new command
can scaffold for CRDs deployed in that cluster.

Currently, only the CREATE operation is supported, UPDATE and DELETE will be
added in the future.

## Policy updates

Through this cycle, we have updated the following policies.

### Container-resources policy

This policy checks for resource limits on the containers, and mutates them to
add limits if configured so.

With its new release `v0.3.0`, the policy now will not mutate the resource
with a limit that is less than the requested, but will reject the resource
instead, to force the user to change the minimum request resource amount or
adjust the policy configuration.

### User-group-psp policy

Starting with `v0.6.2`, if the container image validation is enabled (with
`validate_container_image_configuration`), the policy will only check for it
when the rule is "MustRunAs" or "MayRunAs"; "RunAsAny" does not check the
container image.

## Maintenance updates

As usual, we perform maintenance updates of our dependencies. Notably, in this
release we have updated `sigs.k8s.io/controller-runtime` on the Go projects,
and the development devependency on `github.com/docker/docker`. We depend on
Docker for our testcontainers, which are only run for tests in development and
not shipped in the release artifacts. Nevertheless, The kubewarden-controller
and audit-scanner images were showing a Docker-related CVE present, which now
will be gone.

## Paving work for next releases

Thanks to the reduction of technical debt in the Kubewarden controller, we can
now iterate faster on this codebase. Stay tuned for the following features:

### Cert-manager dependency removal and certificate auto-renewal

We intend to remove the dependency on Cert-manager, by providing automatic CA and
certificate creation and rotation across kubewarden-controller and policy-server.

This means that Kubewarden will, on first install, create its own CA, saved in
a Secret. Both the Webhook and the policy-server connections will use this CA
to create their own leaf certificates, also saved in Secrets. The controller
and policy-server will both automatically reload their certificates securely.

If you are still interested on using Cert-manager, get in contact with us!

### PolicyGroups CRD

Following on the work done in 1.15 on policy-server, we keep pushing forward in
teaching the Kubewarden controller about the new PolicyGroups CRD. We are in the final
steps of the implementation, if you would like to know more about PolicyGroups,
have a look at [our related RFC](https://github.com/kubewarden/rfc/blob/main/rfc/0020-policy-group.md).

## Bye and Let's stay in touch!

Stay tuned for more updates, and happy policy writing!

As always, we are curious about what features you would like next and how you
are enjoying Kubewarden. Reach out on
[Slack](https://kubernetes.slack.com/?redir=%2Fmessages%2Fkubewarden) or join
our [monthly community
meeting](https://teamup.com/ks2bj74dvw132mhjtj?view=a&showProfileAndInfo=0&showSidepanel=1&disableSidepanel=1&showMenu=1&showAgendaHeader=1&showAgendaDetails=0&showYearViewHeader=1) to
talk all things Kubewarden.
