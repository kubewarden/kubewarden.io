---
title: Kubewarden 2022 Wrapped
authors:
- Flavio Castelli
date: 2022-12-29
---

With 2022 almost over, it's time to look back at what happened within
the Kubewarden project during the last year.

## The 1.0 release

A significant milestone for the project in 2022 was
the [release of  Kubewarden v1.0.0](/blog/2022/06/v1-release/) during the month of June.

With this release, the Kubewarden team committed to the stability of all the
public interfaces of the project and all its Kubernetes Custom Resource Definitions.

Moreover, the project was considered ready to be used in production environments.

## CNCF inclusion

Another exciting event took place during the month of June. That's when
[Kubewarden's inclusion in the CNCF sandbox](/blog/2022/06/cncf-sandbox-inclusion/)
took place.

On top of being a great recognition of the quality and potential of the project, the
acceptance into CNCF led to an exciting integration with
[ArtifactHub](/blog/2022/07/artifact-hub-supports-kubewarden/).
This proved to be a great improvement not just for policy authors, but also
for Kubewarden users who can now find all the existing policies
on the [familiar ArtifactHub interface](https://artifacthub.io/packages/search?kind=13&sort=relevance&page=1).

By being part of CNCF, Kubewarden also got access to another CNCF project,
[CLOMonitor](https://clomonitor.io/projects/cncf/kubewarden).
Thanks to CLOMonitor, Kubewarden's users have a clear picture of the project health
and can assess its development and security practices.

## Pod Security Policy replacement

During the month of August, Kubernetes 1.25 release finally removed
[Pod Security Policies](https://kubernetes.io/docs/concepts/security/pod-security-policy/).

This event was planned and advertised for a long time. Due to this,
the Kubewarden developers were able to provide
[tooling, policies, and documentation](https://docs.kubewarden.io/tasksDir/psp-migration)
to smoothen the migration process from Kubernetes Pod Security Policies to
Kubewarden policies.

## Secure supply chain

The topic of secure supply chain started to emerge near the end of 2021, but it
was during this year that many projects and organizations tackled it.

The [sigstore](https://sigstore.dev) project proved to be one of the pillars of
these initiatives.
Kubewarden invested early in the Sigstore project, with some of our maintainers being
active also within the Sigstore community.

During the last year Kubewarden embraced Sigstore to
[securely distribute its own assets](/blog/2022/04/securing-kubewarden-policies/),
like container images, policies, helm charts and cli utilities.
Moreover, we exposed Sigstore capabilities to our policy authors and provided
a [ready to use policy](https://artifacthub.io/packages/kubewarden/verify-image-signatures/verify-image-signatures)
that can be used to vet the container images used by Kubernetes workloads.

Sigstore provides different ways to sign artifacts: with
traditional keys,
[keyless mode](/blog/2022/05/verifying-image-signatures/),
[keyless mode from a GitHub Action workflow](/blog/2022/07/verify-signatures-with-gha-and-prefix/) or
by using [self-signed certificates](/blog/2022/12/sigstore-certificate-verification/)
stored on a physical token or provided by a KMS.
During the last year we kept extending Kubewarden to ensure all these scenarios would be
available also to our users.

## Other notable features

A stream of improvements have been made to the Kubewarden project during the last
year.

The Kubernetes integration was further expanded by introducing the new
[`AdmissionPolicy`](/blog/2022/03/admission-policy/) Custom Resource. This allows
regular Kubernetes users to define policies that are scoped to a specific
Namespace.

Next, we introduced a new operating mode for all our policies: the
["monitor"](/blog/2022/05/monitor-mode/) mode. This allows Kubernetes administrators
to better understand how a policy would impact their existing clusters once it was
enforced.

More recently, the Kubewarden developers simplified the process of deploying
Kubewarden inside of [air gapped](/blog/2022/11/airgap/) environments. This
has been achieved by providing small helpers, writing documentation and, most
important of all, dedicated QA efforts.

## New policies

During the last months we created many ready-to-use policies.
Some of them are:

* [Verify image signatures](https://artifacthub.io/packages/kubewarden/verify-image-signatures/verify-image-signatures): this
  policy leverages Sigstore capabilities to ensure only trusted workloads are
  admitted inside of your clusters
* [Environment variables secret scanner](/blog/2022/10/env-var-secrets/): this policy finds
  secrets, like private keys and API tokens, that are being leaked via environment
  variables
* [Deprecated resources](/blog/2022/11/deprecation-policy/): this policy can be
  used to prevent the creation of resources that are deprecated by Kubernetes

## See you in 2023!

One of the major changes in 2023 will be the introduction of
[community meetings](/blog/2022/12/community-meeting/).
The first meeting will be held on
[January 12th, 2023 at 4 PM UTC](https://www.timeanddate.com/worldclock/converter.html?iso=20230112T160000&p1=1440).

We look forward to having you join these meetings and interacting with the rest of the
Kubewarden community. Not only will you learn about the latest happenings within
the project, but you will also be able to share your feedback and Kubewarden stories
with everybody else.

In the meantime, on behalf of the Kubewarden project, I'd like to wish all our users a Happy New Year! 🍾 🎆 🎉
