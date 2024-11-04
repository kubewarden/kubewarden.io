---
title: Kubewarden 1.18 release, SLSA level 3
authors:
  - Víctor Cuadrado Juan
date: 2024-11-04
---

We are thrilled to announce the release of Kubewarden v1.18.0. For this release
we have focused on achieving level 3 of the [SLSA
standard](https://slsa.dev/spec/v1.0/), in addition to minor bug fixes,
adding tests, and developer tech debt improvements.

## SLSA level 3

Kubewarden has been at the forefront of Sigstore integration (being
co-maintainers of the upstream sigstore-rs Rust library), and have signed our
artifacts and provided SBOMs for several years.

For this cycle, we have made the necessary changes to our build pipelines to
achieve level 3 of SLSA. [SLSA](https://slsa.dev/spec/v1.0) is the standard
for describing and improving supply chain security.

To achieve [SLSA level 3](https://slsa.dev/spec/v1.0/levels#build-l3), projects
need to provide a hardened build platform with strong tamper protection. All of
this is verified by providing signed provenance attestations, which verify
the build process, build dependencies, and aid in replicating the builds.

For us in Kubewarden this meant a slight refactor of our GitHub Actions
workflows to flatten reusable workflows, passing the artifacts' digest to the
provenance attestation creation securely, and publishing these new
attestations. For the attestation creation we have used `docker buildx`'s
attestation creation settings and the actions/attest-build-provenance` GitHub
Action.

### New provenance attestations

We now publish provenance attestations for:

- Container images: shipped as a signed container image layer.
- Helm charts in our OCI registry: shipped as a signed OCI artifact layer
  into GitHub's immutable attestation storage.
- Our CLI utility `kwctl`: shipped into GitHub's immutable attestation storage.

In Kubewarden we also use the following 3rd party dependencies:

- Community charts that we include as subcharts: Policy Reporter, to which we
  have submitted provenance creation upstream.
- `kubectl` image used for Helm hooks: We will move to
  [`rancher/kuberlr-kubectl`](https://github.com/rancher/kuberlr-kubectl), which
  comes with provenance, and provides cached kubectl commands useful for airgap
  installs.

We have decided to implement provenance for policies at a later date.
Currently, policies can be either out of band OCI artifacts (usually from
artifacthub.io), or just a YAML definition (e.g: CEL policies using
[cel-policy](https://artifacthub.io/packages/kubewarden/cel-policy/cel-policy)),
or Kyverno DSL policies using [kyverno-dsl
-policy](https://github.com/kubewarden/kyverno-dsl-policy). In addition, all
policies are sandboxed thanks to WebAssembly.

### Verifying the attestations

For verifying the attestations, have a look at our
[docs](https://docs.kubewarden.io/tutorials/verifying-kubewarden). As usual,
we sign our attestations via Sigstore with keyless workflow.

The UX for verifying provenance attestations is still somewhat unproven across
this space. For binaries such as `kwctl` is as easy as:

```console
$ gh attestation verify kwctl-linux-x86_64 --repo kubewarden/kwctl
Loaded digest sha256:64e0e28eef99f69a1e86f2677bb9c506c3fafe6d743c354b8a4b1c1b5ac90176 for file://kwctl-linux-x86_64
Loaded 2 attestations from GitHub API
✓ Verification succeeded!

sha256:64e0e28eef99f69a1e86f2677bb9c506c3fafe6d743c354b8a4b1c1b5ac90176 was attested by:
REPO              PREDICATE_TYPE                  WORKFLOW
kubewarden/kwctl  https://slsa.dev/provenance/v1  .github/workflows/build.yml@refs/tags/v1.18.0-rc1
kubewarden/kwctl  https://slsa.dev/provenance/v1  .github/workflows/build.yml@refs/heads/main
```

For container images, it means first finding the attestation manifest index
layer, and then the attestation layer itself. If in doubt, read each project's
developer docs in their respective GitHub repositories.

## shortNames for our CRDs

Kubernetes supports short names for CRDs, and after the new PolicyGroups
feature, we think it's the perfect moment to include them. Short names simplify
day-to-day operations. For example, to list ClusterAdmissionPolicies:

```
kubectl get cap
NAME                        POLICY SERVER   MUTATING   BACKGROUNDAUDIT   MODE      OBSERVED MODE   STATUS   AGE
do-not-run-as-root          default         true       true              monitor   monitor         active   3d
do-not-share-host-paths     default         false      true              monitor   monitor         active   3d
...
```

That's a lot better, right?

Here's our shortened resource types:

| Resource                     | shortName |
| ---------------------------- | --------- |
| AdmissionPolicies            | **ap**    |
| ClusterAdmissionPolicies     | **cap**   |
| AdmissionPolicyGroups        | **apg**   |
| ClusterAdmissionPolicyGroups | **capg**  |
| PolicyServers                | **ps**    |

## Deprecation of CRDs version `v1alpha2`

With this release, we are deprecating our CRDs version `v1alpha2` in favour of
the current `v1`. The current `v1` have been in use for several years already.
There’s no action on the users side, since our controller already takes care of
the migration.

## Getting in touch

As always, you can contact us through [Slack](https://kubernetes.slack.com/?redir=%2Fmessages%2Fkubewarden) and
[GitHub discussions](https://github.com/orgs/kubewarden/discussions).
