---
title: Verifying image signatures
authors:
- Raul Cabello Martin
date: 2022-05-02
---

We continue to add support for verifying the integrity and authenticity of artefacts within Kubewarden using the Sigstore project. In this
post, we shall focus on verifying container image signatures using the
new [verify-image-signatures](https://github.com/kubewarden/verify-image-signatures) policy

If you don't know how Sigstore works, we recommend reading our
previous [blog](https://www.kubewarden.io/blog/2022/04/securing-kubewarden-policies/)

## Verify Image Signatures Policy

This policy validates Sigstore signatures for images that match the name provided. If all signature validations pass or
there is no container that matches the image name, the Pod will be accepted.

This policy also mutates matching images to add the image digest, therefore the version of the deployed image can't
change. This mutation can be disabled in the [settings](https://github.com/kubewarden/verify-image-signatures#settings).

## Let's see it in action!

For this example, a Kubernetes cluster with Kubewarden already installed is required. The installation process is
described in the [quick start guide](https://docs.kubewarden.io/quick-start.html).

We need an image with a signature that we can verify. You can use [cosign](https://github.com/sigstore/cosign) to sign
your images. For this example we'll use the image
`ghcr.io/kubewarden/test-verify-image-signatures:signed` that was signed using a key. 

We will use the following public key to verify the signature:

```
-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEALYYVLuPXXcKajo5meRcU+c6/iZe
Dh+o3ZZs1puVW5FyS1cOusnLn209R0IOFL479vm1iFn+auB41JJZUxfc8g== 
-----END PUBLIC KEY-----
```

Let's create a cluster-wide policy that will verify all images from the Kubewarden ghcr repository, and
we'll use the previous public key for verification:

```
kubectl apply -f - <<EOF
apiVersion: policies.kubewarden.io/v1alpha2
kind: ClusterAdmissionPolicy
metadata:
  name: verify-image-signatures
spec:
  module: https://github.com/kubewarden/verify-image-signatures/releases/download/v0.1.1/policy.wasm
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
        - image: "ghcr.io/kubewarden/*"
          pubKeys:
            - |
              -----BEGIN PUBLIC KEY-----
              MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEALYYVLuPXXcKajo5meRcU+c6/iZe
              Dh+o3ZZs1puVW5FyS1cOusnLn209R0IOFL479vm1iFn+auB41JJZUxfc8g==
              -----END PUBLIC KEY-----
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
    image: ghcr.io/kubewarden/test-verify-image-signatures:signed
EOF
```

Then check that the image was modified with the digest

```
kubectl get pod verify-image-valid -o=jsonpath='{.spec.containers[0].image}'
```

```
ghcr.io/kubewarden/test-verify-image-signatures:signed@sha256:1d9d3da4c60d27b77bb96bba738319c1c4424853fdd10f65982f9f2ca2422a72
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
Error from server: error when creating "STDIN": admission webhook "clusterwide-verify-image-signatures.kubewarden.admission" denied the request: Pod verify-image-invalid is not accepted: verification of image ghcr.io/kubewarden/test-verify-image-signatures:unsigned failed: error invoking wapc verify: Error(HostError("Callback evaluation failure: signatures can't be fetched for image: ghcr.io/kubewarden/test-verify-image-signatures:unsigned"))
```

This policy is designed to meet all your needs. However, if you prefer you can build your own policy using one of the SDKs Kubewarden
provides. We will show how to do this in an upcoming blog! Stay tuned!
