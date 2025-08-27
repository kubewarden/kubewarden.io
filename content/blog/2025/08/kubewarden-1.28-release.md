---
title: "Kubewarden 1.28 Release"
authors:
  - Víctor Cuadrado Juan
date: 2025-08-27
---

Kubewarden 1.28 has emerged refreshed from a bath in the lake (just like my dog
on the morning walk before writing this post!). This release cycle comes
mainly with improvements on policies, though some stack features plus `kwctl`
bugfixes also bubbled up.

## Supporting Hauler for air-gap installs

With 1.28, our Helm chart releases now include a [Hauler](https://hauler.dev)
YAML manifest.

Hauler is an Open Source project that provides a declarative way of saving all
artifacts needed for air-gap installs, along with a tool (the `hauler` cli)
that works with it without requiring operators to adopt a specific workflow.

How does a Hauler YAML manifest look like? Have a look at
[ours](https://github.com/kubewarden/helm-charts/releases/download/kubewarden-defaults-3.6.0/hauler_manifest.yaml).
Here's an excerpt:

```yaml
apiVersion: content.hauler.cattle.io/v1
kind: Images
metadata:
  name: kubewarden-container-images
  annotations:
    hauler.dev/certificate-oidc-issuer: https://token.actions.githubusercontent.com
spec:
  images:
    - name: ghcr.io/kubewarden/audit-scanner:v1.28.0
      certificate-identity-regexp: https://github.com/kubewarden/audit-scanner/.github/workflows/release.yml@refs/tags/v1.28.0
    - name: ghcr.io/kubewarden/kubewarden-controller:v1.28.0
      certificate-identity-regexp: https://github.com/kubewarden/kubewarden-controller/.github/workflows/release.yml@refs/tags/v1.28.0
    - name: ghcr.io/kubewarden/policy-server:v1.28.0
      certificate-identity-regexp: https://github.com/kubewarden/policy-server/.github/workflows/release.yml@refs/tags/v1.28.0
# (...)
```

With this manifest and the [`hauler`
cli](https://docs.hauler.dev/docs/next/introduction/install) tool, you can
create an archive file with all the needed artifacts (Helm charts, container
images, policies). This also verifies the artifacts via cosign, so you can
confidently jump past the air gap to install or regularly update your
Kubewarden stack:

```console
(dev)$ hauler store sync --filename hauler_manifest.yaml # downloads and verifies all artifacts locally
(dev)$ hauler store save --filename haul.tar.zst         # saves artifacts to an archive file

(airgap)$ hauler store load --filename haul.tar.zst                # load artifacts from archive file
(airgap)$ hauler store copy registry://my-secure-airgap-registry   # copy to airgapped registry
(airgap)$ helm upgrade -i --wait -n kubewarden \
            kubewarden-crds --create-namespace \
            oci://my-secure-airgap-registry/hauler/kubewarden-crds
```

You can find a more complete [how-to example](https://docs.kubewarden.io/next/howtos/airgap/hauler)
in our docs.

For this new feature, we automated the creation on this Hauler manifest with
[updatecli](https://www.updatecli.io/), in addition of expanding our end-to-end
air-gap tests to make use of it.

## Major version bump: environment-variables policy v3

The [`environment-variables`
policy](https://artifacthub.io/packages/kubewarden/environment-variable-policy/environment-variable-policy)
has jumped to `v3`, which signifies backwards-incompatible changes, in
addition to the new features. The new settings are as follows:

```yaml
settings:
  criteria: "containsAnyOf" # new: "containsOtherThan", "doesNotContainOtherThan"
  values: # previously "envvars"
    - MARIADB_USER
    - MARIADB_PASSWORD
```

We have added these 2 criteria: `containsOtherThan` and
`doesNotContainOtherThan`. The second one implements an allowlist.

For this, we refactored the policy separating the logic into a subcrate, which
allows us to reuse it for policies similar to the following one.

## 2 new policies: labels policy, annotations policy

The new [`labels`
policy](https://artifacthub.io/packages/kubewarden/labels-policy/labels) and
[`annotations`
policy](https://artifacthub.io/packages/kubewarden/annotations-policy/annotations)
follow the same behaviour as the environment-variables policy, but for labels
and annotations. They reuse the logic implementation (and its unit tests), and their settings
look the same. Here's the `annotations` policy for example:

```yaml
settings:
  criteria: "containsAnyOf"
  values:
    - example.com/application
    - cost-center
```

## Major version bump: trusted-repos policy v2

The [`trusted-repos`
policy](https://artifacthub.io/packages/kubewarden/trusted-repos/trusted-repos)
also has jumped to `v2`. This signifies a backwards-incompatible change when
matching images, the policy now is more powerful when allowing or rejecting images.
For example:

```yaml
images:
  allow:
    - nginx
    - quay.io/coreos/etcd
```

Will allow container images like `nginx:1.21`, `nginx:latest`,
`docker.io/library:nginx:1.21`, `quay.io/coreos/etcd:1.21`,
`quay.io/coreos/etcd:latest`.

The same happens for rejection:

```yaml
images:
  reject:
    - nginx
    - quay.io/coreos/etcd
```

Will reject container images like `nginx:1.21`, `nginx:latest`,
`docker.io/library:nginx:1.21`, `quay.io/coreos/etcd:1.21`,
`quay.io/coreos/etcd:latest`.

## Policies' minor bug fixes

The [`host-namespaces`
policy](https://artifacthub.io/packages/kubewarden/host-namespaces-psp/host-namespaces-psp)
and [`user-group-psp`
policy](https://artifacthub.io/packages/kubewarden/user-group-psp/user-group-psp)
now declare in their metadata that they can validate `UPDATE` operations of
Pods too. They _could_ always validate `UPDATE` operations, but the metadata didn't
reflect it. If you deployed them by doing a `kwctl scaffold manifest`, it may
be worth to refresh your policy definitions.

## kwctl improvements

While already shipped as patch releases, kwctl recently got several bug fixes:

kwctl `1.27.1` (see [blog
post](https://www.kubewarden.io/blog/2025/07/kubewarden-1.27.1-release/)) fixed
a regression when `spec.mode` is defined, as kwctl recently gained the feature
of honouring it.

kwctl `1.27.2` (see [blog
post](https://www.kubewarden.io/blog/2025/07/kubewarden-1.27.2-release/)) fixed 2
bugs when performing `scaffold admission-request`; now it will create a cache
of resources correctly and not error nor stop execution.

kwctl `1.27.3`(see [blog
post](https://www.kubewarden.io/blog/2025/07/kubewarden-1.27.3-release/)) fixes
a bug when doing `kwctl run`of PolicyGroups if the policies in the group were
of different type (e.g: one Rego and another waPC Rust).

All of these changes are now part of 1.28.

## Maintenance & tech debt

As usual, we tackle some maintenance and pay off some tech debt. For this cycle,
apart from the usual dependency bumps, we have performed a partial migration to Golang 1.25:

- Finished for the Go policies, which comes with a needed bump to [Tinygo 0.39](https://github.com/tinygo-org/tinygo/releases/tag/v0.39.0),
  also included in our [kubewarden/github-actions](https://github.com/kubewarden/github-actions) reusable workflows for CI/CD.
- Our container images also got the bump, but the changes will be released on
  the next version.

# Getting in touch

Join the conversation on
[Slack](https://kubernetes.slack.com/?redir=%2Fmessages%2Fkubewarden) or
[GitHub discussions](https://github.com/orgs/kubewarden/discussions) and let us
know how you’re finding Kubewarden 1.28!
