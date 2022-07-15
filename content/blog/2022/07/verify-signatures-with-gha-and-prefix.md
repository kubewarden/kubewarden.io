---
title: Verify image signatures with GithubActions and KeylessPrefix 
authors:
- Raul Cabello Martin 
date: 2022-07-14
---

With the latest releases of Kubewarden v1.1.0 and
the [verify-image-signatures](https://github.com/kubewarden/verify-image-signatures) policy, it's now possible to use
`GithubActions` or `KeylessPrefix` for verifying images. Read our
previous [blog post](https://www.kubewarden.io/blog/2022/05/verifying-image-signatures/) if you want to learn more about
how to verify container images with Sigstore using Kubewarden.

## Let's see it in action!

We want to verify the image `ghcr.io/raulcabello/app-example` which was signed inside a GitHub action. Let's run the
following command to see the issuer and subject:

```
COSIGN_EXPERIMENTAL=1 cosign verify ghcr.io/raulcabello/app-example:v0.4.0
```

The output is:

```json 
{
  ....
  "Issuer": "https://token.actions.githubusercontent.com",
  "Subject": "https://github.com/raulcabello/app-example/.github/workflows/ci.yml@refs/tags/v0.4.0"
}
```

For this example, a Kubernetes cluster with Kubewarden already installed is required. The installation process is
described in the [quick start guide](https://docs.kubewarden.io/quick-start).

Let's verify this image with the new signature types: GitHubAction and KeylessPrefix

### GitHubAction

```yaml 
apiVersion: policies.kubewarden.io/v1
kind: ClusterAdmissionPolicy
metadata:
name: verify-image-signatures-policy
spec:
module: registry://ghcr.io/kubewarden/policies/verify-image-signatures:v0.1.4
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
        - image: "ghcr.io/raulcabello/app-example:*" # match all tags 
          github_actions:
            - owner: "raulcabello"
              repo: "app-example" #optional. if omited all apps from the owner will ve valid.
```

This policy verifies all containers with an image that is `ghcr.io/raulcabello/app-example`. It will accept
containers that were signed inside a GitHub action for the owner `raulcabello` and the app `app-example`.

### KeylessPrefix

```yaml 
apiVersion: policies.kubewarden.io/v1
kind: ClusterAdmissionPolicy
metadata:
name: verify-image-signatures-policy
spec:
module: registry://ghcr.io/kubewarden/policies/verify-image-signatures:v0.1.4
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
        - image: "ghcr.io/raulcabello/app-example:*" # match all tags 
          keyless_prefix:
            - issuer: "https://token.actions.githubusercontent.com"
              subject: "https://github.com/raulcabello/app-example/.github/workflows/ci.yml@refs/tags/" # match all tags
```

This policy verifies all containers with an image that is `ghcr.io/raulcabello/app-example`. It will accept
containers whose signatures subjects start
with `https://github.com/raulcabello/app-example/.github/workflows/ci.yml@refs/tags/`.

Check it out and let us know if you have any questions! Stay tuned for more blogs on how to secure your supply chain with Kubewarden!
