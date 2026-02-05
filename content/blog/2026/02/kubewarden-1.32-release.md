---
title: "Kubewarden 1.32 Release"
authors:
  - Víctor Cuadrado Juan
date: 2026-02-05
---

Another year rolls around, and Kubewarden is still growing like a well-watered
houseplant! Kubewarden got a new year’s resolution to tidy up and repot, and
have gone full in with this digital gardening. This release is a maintenance
one, with big moves to monorepos and a refresh in release artifacts.


## New Admission Controller monorepo

With the inclusion of [SBOMscanner](https://www.kubewarden.io/blog/2025/11/expanding-kubewarden-scope)
to the Kubewarden harvest, we saw a great moment for cleanup on the Admission Controller side.

Previously, we had several repositories for all the bits and pieces. Main repos
such as [kubewarden-controller](github.com/kubewarden/kubewarden-controller),
[policy-server](github.com/kubewarden/policy-server),
[audit-scanner](github.com/kubewarden/audit-scanner), and
[kwctl](github.com/kubewarden/kwctl). And library repos such as
[policy-evaluator](github.com/kubewarden/policy-evaluator),
[policy-fetcher](github.com/kubewarden/policy-fetcher),
[context-aware-test-policy](github.com/kubewarden/context-aware-test-policy), and so on.

Now, all of that them are included in our admission controller monorepo:

**[github.com/kubewarden/kubewarden-controller](https://github.com/kubewarden/kubewarden-controller)**

This monorepo now contains all the bits and libraries to build the Admission
Controller and our `kwctl` CLI library.

To make this monorepo a reality, we tackled quite the list of tasks for each of
those repositories: we moved to a Cargo workspace, added Go code for the
Controller and Audit Scanner, refactored such codebases a bit, adapted CI/CD
pipelines (including [Updatecli](https://www.updatecli.io/) pipelines),
streamlined GitHub release and package automation, cleaned up legacy
directories, and updated development documentation and contribution guidelines
between others.

This turned out to be an epic effort, and we are happy on how it's turning up.
It ensures that every part of the Admission Controller, from code to releases
now lives and grows together, making development smoother and future
improvements easier for everyone.


### Developing with Tilt

Tilt is a developer tool that installs your local Helm charts, rebuilds your
images and live-updates your development environment whenever you make changes
to the code.

We have taken this opportunity to migrate our [Tilt](https://tilt.dev/) configs
and institutionalize them inside the Admission Controller monorepo. With this,
you are just one `tilt up` command away from having a nice development session
of the Kubewarden admission controller and all its bits. You can then open the
Tilt web interface to monitor how everything behaves, make your code changes,
and see everything rebuilding and refreshing in real time.

{{<figure src="/images/tilt.png" alt="Tilt initialization screenshot" >}}

Read our refreshed
[CONTRIBUTING.md](https://github.com/kubewarden/kubewarden-controller/blob/main/CONTRIBUTING.md#development)
to get up to speed.


## New Policies monorepo

What better moment to keep folding repositories than this release. We have also
herded our Rust, Go (WASI & WaPC), and Rego policy repositories into a general policy
monorepo:

**[github.com/kubewarden/policies](https://github.com/kubewarden/policies)**

This monorepo contains (at the time of writing) 55 policies that used to live
each in their own repository.

The new policies monorepo has per-policy Makefiles, and a CI/CD that heavily
reuses those local Make targets.  Of course, with end-to-end tests, unit tests,
format and linting. We also continue to have nice dependency and release
automation with [Updatecli](https://www.updatecli.io/) and Renovate bot, and a
ton of less GitHub notifications, which is a joy to maintain. We are happy to
see that contributors find it easier to work with them too!

All these policies are released in
[artifacthub.io](https://artifacthub.io/packages/search?kind=13&sort=relevance&page=1),
and nothing has changed there. Thanks to the Artifact Hub maintainers
collaboration, we were able to migrate all of them without hiccup. Cheers to
them!

This monorepo mirrors our already existing monorepo for Rego policies in
[kubewarden/rego-policies-library](github.com/kubewarden/rego-policies-library).


## Changes to release artifacts

The `kwctl` CLI binary release artifacts can now be found in the [GitHub
releases](https://github.com/kubewarden/kubewarden-controller/releases) of our
controller monorepo.

The GitHub releases under [kubewarden/helm-charts](https://github.com/kubewarden/helm-charts/releases)
don't ship anymore a `<charts>_images.xt`, yet each of the Helm charts keep
including their own `imagelist.txt` and `policylist.txt` inside the charts to
aid in air-gap installation. See our updated [air-gap
docs](https://docs.kubewarden.io/next/howtos/airgap/install) (we recommend
using [Hauler](https://docs.hauler.dev/docs/intro)).

### Changes to Cosign signature metadata

Cosign signatures of our artifacts have changed their CertificateIdentity with
the change of repositories.

Container images, kwctl, and policies are now performed
differently as their GitHub release workflow URI has changed:
- `policy-server`, `audit-scanner` images are now signed by the
  `github.com/kubewarden/kubewarden-controller` `release.yml` job
- `kwctl` artifacts are now signed by the
  `github.com/kubewarden/kubewarden-controller` `release.yml` job.
- Policies are now signed by the `github.com/kubewarden/policies` `release.yml` job.

For example, the `policy-server` image was previously produced by a GH release
workflow under kubewarden/policy-server and now is generated from
kubewarden/kubewarden-controller. This means that:
- Old `policy-server:v1.31.0` CertificateIdentity used to have SAN value of:
  `"https://github.com/kubewarden/policy-server/.github/workflows/release.yml@refs/tags/v1.31.0"`
- New `policy-server:v1.32.0` has now SAN value of:
  `"https://github.com/kubewarden/kubewarden-controller/.github/workflows/release.yml@refs/tags/v1.32.0"`

The [slsactl](https://github.com/rancherlabs/slsactl) utility has been updated
for this change.


## Simplifying versioning: patching together

Previously, our images and our `kwctl` CLI utility could to get patch releases
independently. For example, we could have a `policy-server:1.32.0` image and
`kwctl` in version `1.32.1`.

From now on, we will release the Kubewarden Admission Controller stack all in
sync: if the `policy-server` container image gets a patch release, so will be
the `kubewarden-controller` image and our `kwctl` utility. As usual, we have
documented this in our [RFC](https://github.com/kubewarden/rfc/pull/53) repo,
as well as updated the
[docs](https://docs.kubewarden.io/next/reference/upgrade-path#stack-version-compatibility-among-components).


## Ongoing cleanup touches

there's still some minor cleanups, reorg, and even further automation to
perform for the benefit of developers. These cleanups will land in future
versions.

Our docs at doc.kubewarden.io will also get expanded in the near future. Stay
tuned!


# Getting in touch

Join the conversation on
[Slack](https://kubernetes.slack.com/?redir=%2Fmessages%2Fkubewarden) or
[GitHub discussions](https://github.com/orgs/kubewarden/discussions) and let us
know how you’re finding Kubewarden 1.32!
