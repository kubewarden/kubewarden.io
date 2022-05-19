---
title: "Secure Supply Chain: Verifying image signatures"
authors:
- Raul Cabello Martin
date: 2022-05-02
---

After these last releases Kubewarden now has support for verifying the integrity and authenticity of artefacts within
Kubewarden using the Sigstore project. In this post, we shall focus on verifying container image signatures using the
new [verify-image-signatures](https://github.com/kubewarden/verify-image-signatures) policy

If you don't know how Sigstore works, we recommend reading our
previous [post](https://www.kubewarden.io/blog/2022/04/securing-kubewarden-policies/)

## Verify Image Signatures Policy

This policy validates Pods by checking their container images for signatures (that is, containers, init containers and 
ephemera containers in the pod). If all signature validations pass or there is no container image that matches the image
name query, the Pod will be accepted.

Once the image has been verified with a signature, one needs to ensure that the specific image tag from that signature 
is the one instantiated. This is achieved by the policy by mutating the Pod request and adding that validated image digest. 
This mutation can be disabled in the [settings](https://github.com/kubewarden/verify-image-signatures#settings).

## Let's see it in action!

For this example, a Kubernetes cluster with Kubewarden already installed is required. The installation process is
described in the [quick start guide](https://docs.kubewarden.io/quick-start.html).

We need an image with a signature that we can verify. You can use [cosign](https://github.com/sigstore/cosign) to sign
your images. For this example we'll use the image
`ghcr.io/viccuad/app-example:v0.1.0` that was signed using keyless verification. 

Obtain the issuer and subject using cosign.

```
COSIGN_EXPERIMENTAL=1 cosign verify ghcr.io/viccuad/app-example:v0.1.0
```

```
...
"Issuer": "https://token.actions.githubusercontent.com",
"Subject": "https://github.com/viccuad/app-example/.github/workflows/ci.yml@refs/tags/v0.1.0"
...
```

Let's create a cluster-wide policy that will verify all images, and
we'll use the issuer and subject for verification:

```
kubectl apply -f - <<EOF
apiVersion: policies.kubewarden.io/v1alpha2
kind: ClusterAdmissionPolicy
metadata:
  name: verify-image-signatures
spec:
  module: ghcr.io/kubewarden/policies/verify-image-signatures:v0.1.4
  rules:
  - apiGroups: [""]
    apiVersions: ["v1"]
    resources: ["pods"]
    operations:
    - CREATE
    - UPDATE
  mutating: true
  settings:
    signatures:
      - image: "*"
        keyless:
          - issuer: "https://token.actions.githubusercontent.com"
            subject: "https://github.com/viccuad/app-example/.github/workflows/ci.yml@refs/tags/v0.1.0"
EOF
````

Wait for the policy to be active:

```
kubectl wait --for=condition=PolicyActive clusteradmissionpolicies verify-image-signatures
```

Verify we can create pods with containers that are signed:

```
kubectl apply -f - <<EOF
apiVersion: v1
kind: Pod
metadata:
  name: verify-image-valid
spec:
  containers:
  - name: test-verify-image
    image: ghcr.io/viccuad/app-example:v0.1.0
EOF
```

Then check that the image was modified with the digest

```
kubectl get pod verify-image-valid -o=jsonpath='{.spec.containers[0].image}'
```

```
ghcr.io/viccuad/app-example:v0.1.0@sha256:d97d00f668dc5b7f0af65edbff6b37924c8e9b1edfc0ab0f7d2e522cab162d38
```

Finally, let's try to create a pod with an image that it is not signed:

```
kubectl apply -f - <<EOF
apiVersion: v1
kind: Pod
metadata:
  name: verify-image-invalid
spec:
  containers:
  - name: test-verify-image
    image: ghcr.io/kubewarden/test-verify-image-signatures:unsigned
EOF
```

We will get the following error:

```
Error from server: error when creating "STDIN": admission webhook "clusterwide-verify-image-signatures.kubewarden.admission" denied the request: Pod verify-image-invalid is not accepted: verification of image ghcr.io/kubewarden/test-verify-image-signatures:unsigned failed: Host error: Callback evaluation failure: no signatures found for image: ghcr.io/kubewarden/test-verify-image-signatures:unsigned 
```

This policy is designed to meet all your needs. However, if you prefer you can build your own policy using one of the SDKs Kubewarden
provides. We will show how to do this in an upcoming blog! Stay tuned!