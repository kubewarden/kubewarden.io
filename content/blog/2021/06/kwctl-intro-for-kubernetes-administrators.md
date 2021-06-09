---
title: Introducing kwctl to Kubernetes Administrators
authors:
    - Flavio Castelli
date: 2021-06-09
---

We are pleased to announce the availability of a new tool within the Kubewarden
project: [kwctl](https://github.com/kubewarden/kwctl).

kwctl is a command line utility designed to help both policy authors
and Kubernetes administrators.

This blog post focuses on the user experience of Kubernetes administrators.
Future ones will cover the policy developer side of the story.

## A Real-World Example: Controlling Container Capabilities

The main character of today's story is Alice. Alice is a Kubernetes
administrator who wants to keep her Kubernetes cluster secure.

Alice uses many solutions to accomplish that, including
[Kubernetes PSP](https://kubernetes.io/docs/concepts/policy/pod-security-policy/).

Pod Security Policies are currently deprecated and are going to be removed from Kubernetes 1.25.
Due to that, Alice wants to find an alternative to Kubernetes PSPs.

Today Alice will work to replace the [container capabilities PSP](https://kubernetes.io/docs/tasks/configure-pod-container/security-context/#set-capabilities-for-a-container)
with a Kubewarden policy.

We will tag along with Alice, watch all the steps she has to perform
and learn how `kwctl` will help her.

## Finding the Right Policy

As a first step, Alice visits [Kubewarden’s Policy Hub](https://hub.kubewarden.io),
the place where Kubewarden policies can be made discoverable.

Alice enters the *"capabilities"* query and finds a policy that seems to be
doing exactly what she's looking for. The name of the policy is
*"psp-capabilities"*.

## Obtaining the Policy

Next Alice has to obtain the policy. This can be done with a
simple command:

```shell
$ kwctl pull registry://ghcr.io/kubewarden/policies/psp-capabilities:v0.1.4
```

This downloads the policy and stores it under Alice's home directory.

## Understanding How the Policy Works

Alice now needs to understand how to use the policy. Each policy listed on
Kubewarden's Policy Hub has links pointing to their documentation.

Instead of opening one of these links, Alice prefers to consult the
metadata provided by the policy:

```shell
$ kwctl inspect registry://ghcr.io/kubewarden/policies/psp-capabilities:v0.1.4
``` 

This command produces the following output:

![Output of kwctl inspect](/images/2021-june-kwctl-intro-admin-inspect-output.png)

> **Note well:** a Kubewarden policy is a regular "`.wasm`" file that, in addition
> to contain the policy's bytecode, it also embeds additional metadata.
>
> This allows to have everything in a **single place**, **versioned together** and
> **available off-line**.

## Evaluating the Policy

Now Alice wants to assess the reliability of the policy, plus find the right
configuration values to satisfy her requirements.

There are some good news for Alice: she doesn't need to deploy the policy into
a Kubernetes cluster to perform this kind of rapid iterations. Once again, kwctl
can help her with the `run` subcommand.

The `kwctl run` command takes the following parameters:
  * **`-r <request-path>`**: path to a file containing the Kubernetes Admission Request
    to be evaluated
  * **`--settings-json "<JSON document>"`**: a string containing the JSON
    representation of policy's settings. It's also possible to use the
    "**`-s <settings-path>`**" flag to read the policy settings from a local file
  * **`<URI of the policy>`**: the URI pointing to the policy to be used

> **Note well:** unfortunately, obtaining Kubernetes Admission Requests
> requires some extra work. This is a "Kubernetes problem", we plan to
> address it in the near future.
>
> In the meantime, we will assume Alice has access to files like
> [these ones](https://github.com/kubewarden/psp-capabilities/tree/a786aba746e807aa3c6121438e8c05e724400861/test_data).

Alice will use [this request](https://raw.githubusercontent.com/kubewarden/psp-capabilities/a786aba746e807aa3c6121438e8c05e724400861/test_data/req_pod_with_container_with_capabilities_added.json);
that attempts to create a Pod with a container that has the
following `securityContext` configuration:

  * Add the `NET_ADMIN` and the `SYS_TIME` capabilities
  * Drop the `SYS_PTRACE` capability

As a first step, Alice defines a policy that allows containers to add only the `SYS_TIME` capability:

```shell
$ kwctl run registry://ghcr.io/kubewarden/policies/psp-capabilities:v0.1.4 \
            -r req_pod_with_container_with_capabilities_added.json \
            --settings-json '{"allowed_capabilities": ["SYS_TIME"]}'
```

The output of the command, piped into [`jq`](https://stedolan.github.io/jq/), is the following one:
```json 
{ 
  "uid": "1299d386-525b-4032-98ae-1949f69f9cfc",
  "allowed": false,
  "status": {
    "message": "PSP capabilities policies doesn't allow these capabilities to be added: {\"NET_ADMIN\"}" 
  }
}
```

This is the behavior expected by Alice: the request is rejected because the
`NET_ADMIN` capability is not part of the allow list.

This policy is capable of mutating incoming requests, Alice wants to try it
out using the following command:

```shell
$ kwctl run registry://ghcr.io/kubewarden/policies/psp-capabilities:v0.1.4 \
        -r req_pod_with_container_with_capabilities_added.json \
        --settings-json '{"default_add_capabilities": ["AUDIT_READ"]}'
```

The command will fail with the following output:
```shell 
{"valid":false,"message":"These capabilities cannot be added by default because they are not allowed: {\"AUDIT_READ\"}"}
Error: Provided settings are not valid: Some("These capabilities cannot be added by default because they are not allowed: {\"AUDIT_READ\"}")
```

Nice, the author of the policy implemented some validation of the settings
provided by the end users!
The error message points Alice in the right direction: the `AUDIT_READ` capability
cannot be added to all the containers unless it's also on the list of the
allowed capabilities.

Alice runs the policy again, this time with a different configuration:

```shell
$ kwctl run registry://ghcr.io/kubewarden/policies/psp-capabilities:v0.1.4 \
      -r req_pod_with_container_with_capabilities_added.json \
      --settings-json '{"default_add_capabilities": ["AUDIT_READ"], "allowed_capabilities": ["AUDIT_READ"]}'
``` 

This time the configuration is correct, but the request is rejected with
the following explanation:

```json
{
  "uid": "1299d386-525b-4032-98ae-1949f69f9cfc",
  "allowed": false,
  "status": {
    "message": "PSP capabilities policies doesn't allow these capabilities to be added: {\"NET_ADMIN\", \"SYS_TIME\"}"
  }
}
```

That's actually a correct behavior, Alice forgot to allow the capabilities
the container is already adding to itself.

Alice now runs the kwctl command one last time:

```shell
$ kwctl run registry://ghcr.io/kubewarden/policies/psp-capabilities:v0.1.4 \
        -r req_pod_with_container_with_capabilities_added.json \
        --settings-json '{"default_add_capabilities": ["AUDIT_READ"], "allowed_capabilities": ["AUDIT_READ", "NET_ADMIN", "SYS_TIME"]}'
```

This time the policy accepts the incoming request, plus it mutates it.
This is the output returned:

```json
{
  "uid": "1299d386-525b-4032-98ae-1949f69f9cfc",
  "allowed": true,
  "patchType": "JSONPatch",
  "patch": "W3sib3AiOiJhZGQiLCJwYXRoIjoiL3NwZWMvY29udGFpbmVycy8wL3NlY3VyaXR5Q29udGV4dC9jYXBhYmlsaXRpZXMvYWRkLzIiLCJ2YWx1ZSI6IkFVRElUX1JFQUQifV0="
}
```

Alice can see what the policy is going to change by looking at the contents of
the `patch` attribute.
As requested by Kubernetes, the patch operation is encoded using `base64`:

```shell
$ kwctl run registry://ghcr.io/kubewarden/policies/psp-capabilities:v0.1.4 \
        -r req_pod_with_container_with_capabilities_added.json \
        --settings-json '{"default_add_capabilities": ["AUDIT_READ"], "allowed_capabilities": ["AUDIT_READ", "NET_ADMIN", "SYS_TIME"]}' \
  | jq -r .patch | base64 -d
```

This produces the following output:
```json
[{"op":"add","path":"/spec/containers/0/securityContext/capabilities/add/2","value":"AUDIT_READ"}]
```

This [JSONPatch](https://en.wikipedia.org/wiki/JSON_Patch) document is composed
by the following parts:
  * **`op`**: this defines the operation to perform against the original request
  * **`value`**: the string to be added to the original request
  * **`path`**: the JSON Pointer that defines which part of the original request
    is going to be changed

Hence, this JSONPatch adds "AUDIT_READ" to the original Pod object, at
`/spec/containers/0/securityContext/capabilities/add/2` location.

Let's take a closer look at the JSON Pointer:

  * **`/spec/containers`**: this references the `containers` section of the Pod `spec`
  * **`/0`**: since `spec.containers` is an array, this fragment of
    the path points to the first element of it. Note well, arrays elements
    are referenced using [zero-based numbering](https://en.wikipedia.org/wiki/Zero-based_numbering)
  * **`/securityContext/capabilities/add`**: this navigates into the `securityContext`
    of the container, then into the `capabilities` object and finally into the
    `add` section. This is the place where container capabilities to be added
    are specified
  * **`/2`**: the original container has already two capabilities to be added,
    `NET_ADMIN` and `SYS_TIME`. Using zero-based numbering, `/2` points to
    the third entry of the array.

The policy is working as expected; it leads to the creation of a Pod with
a container that has the `NET_ADMIN`, `SYS_TIME`, `AUDIT_READ` capabilities
added.

## Deploying the Policy

After more experiments with `kwctl run`, Alice wants to deploy the policy
inside of a Kubernetes cluster.

Kubewarden policies are defined using the
[ClusterAdmissionPolicy](https://github.com/kubewarden/kubewarden-controller/blob/a74144e2c2f69dd96a7317feb44719a03677a885/docs/crds/README.asciidoc),
a Custom Resource provided by Kubewarden.

Alice can quickly scaffold the YAML file defining this resource using kwctl:

```shell
$ kwctl manifest -t ClusterAdmissionPolicy registry://ghcr.io/kubewarden/policies/psp-capabilities:v0.1.4
```

The command will produce the following output:

```yaml
apiVersion: policies.kubewarden.io/v1alpha2
kind: ClusterAdmissionPolicy
metadata:
  name: generated-policy
spec:
  module: "registry://ghcr.io/kubewarden/policies/psp-capabilities:v0.1.4"
  settings: {}
  rules:
    - apiGroups:
        - ""
      apiVersions:
        - v1
      resources:
        - pods
      operations:
        - CREATE
  mutating: true
```

kwctl just saved quite some time for Alice 😊

## Mirroring Policies

Kubewarden policies are distributed via OCI container registries, the very
same pieces of infrastructure already used to distribute container images.

Alice doesn't want her cluster to pull the Kubewarden policy straight from
`ghcr.io/kubewarden/policies/psp-capabilities:v0.1.4`, she rather prefers to
fetch it from a local registry she controls.

This can be done using the following commands:

```shell
$ kwctl push -p registry://ghcr.io/kubewarden/policies/psp-capabilities:v0.1.4
                registry.alice.corp.lan/policies/psp-capabilities:v0.1.4
```

Alice can now use the `registry.alice.corp.lan/policies/psp-capabilities:v0.1.4`
url inside of the `ClusterAdmissionPolicy` definition. 

The policy can now be enforced inside of the local Kubernetes cluster with
a `kubectl apply` command 🎉

## Recap

kwctl allows us to download, test and deploy Kubewarden policies. The UX of kwctl
mimics the one of docker, hence cloud native users should quickly feel at home
with it.

We hope kwctl will be able to simplify the process of interacting with
Kubewarden policies.
We have many ideas about how to further expand its capabilities, but we would
love to hear what you would like to see addressed or changed.

What are you waiting for? Do like Alice and [give kwctl a spin](https://github.com/kubewarden/kwctl/releases)!

