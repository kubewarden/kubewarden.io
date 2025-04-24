---
title: Verify image signatures with GitHub Actions and KeylessPrefix 
authors:
- Raul Cabello Martin 
date: 2022-07-21
---

With the latest releases of Kubewarden v1.1.0 and
the [verify-image-signatures](https://github.com/kubewarden/verify-image-signatures) policy, it's now possible to use
`GithubActions` or `KeylessPrefix` for verifying images. Read our
previous [blog post](https://www.kubewarden.io/blog/2022/05/verifying-image-signatures/) if you want to learn more about
how to verify container images with Sigstore using Kubewarden.

## Let's see it in action!

We want to verify the image `ghcr.io/raulcabello/app-example` which was built and signed inside a GitHub action
using this [GitHub Action](https://github.com/raulcabello/app-example/blob/master/.github/workflows/ci.yml).

Out of the box, GitHub Actions have a specially crafted environment that makes Sigstore keyless signing work in
a non-interactive way.
The signatures produced in this way contain unique secure information that allow us to identify the GitHub owner
(be it an individual or an organization) and the GitHub repository inside of which the GitHub Action has been
executed.

Starting from today, Kubewarden provides a convenient way to check signatures produced by GitHub actions.

For this example, a Kubernetes cluster with Kubewarden already installed is required. The installation process is
described in the [quick start guide](https://docs.kubewarden.io/quick-start).

### GitHub Actions

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
          repo: "app-example" #optional. if omitted all signatures performed in repos from the owner will be valid.
```

This policy verifies all containers with an image that is `ghcr.io/raulcabello/app-example`. It will accept
containers that were signed inside a GitHub Action job, run under the owner `raulcabello` and the repo `app-example`.

### KeylessPrefix

`KeylessPrefix` is similar to the existing keyless verification , the only difference is that it will validate the 
subject based on a prefix instead of an exact match. 

``` yaml
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

This will accept containers whose signature contains the issuer `https://token.actions.githubusercontent.com` and the 
subject starts with `https://github.com/raulcabello/app-example/.github/workflows/ci.yml@refs/tags/`. 

Like in the previous example this will accept the image `ghcr.io/raulcabello/app-example`, however we **don't** recommend using 
`KeylessPrefix` for GitHub actions validation. When GitHub creates the OIDC token used for the signatures, it sets subject as 
the URL containing the GHA workflow code, which doesn't necessarily match where it has run in the case of reusable workflows. 
This is by design. If one wants to check for the repo where the job was run, corresponding to that workflow code, GitHub has added a x509
certificate extension `github_workflow_repository` that contains it. In future releases `KeylessPrefix` validation that has
`https://token.actions.githubusercontent.com` as issuer will fail.

Check it out and let us know if you have any questions! Stay tuned for more blogs on how to secure your supply chain with Kubewarden!
