---
title: Kubewarden 1.5.0 release
authors:
- José Guilherme Vanz
date: 2023-01-20
---

Today we're pleased to announce the availability of Kubewarden 1.5.0!

This release brings the usual amount of small bug fixes, dependency updates, and a major security enhancement.
Let's take a closer look!

## Policy evaluation timeout

The Kubewarden team is constantly working to improve the security posture of the project. As part of these efforts,
we're excited to introduce the new "policy evaluation timeout" feature.

Starting from this release, Policy Server will interrupt the evaluation of admission requests after a certain amount of time has elapsed.
This security feature, which is enabled by default, prevents a Policy Server from running out of computing
resources because one or more of its policy evaluations are stuck in infinite loops.
This mitigates a type of Denial Of Service (DOS) attacks against the Policy Server.

Take a look at the Kubewarden [documentation](https://docs.kubewarden.io/operator-manual/policy-evaluation-timeout)
to get more information about this new feature.

## Changes to kwctl

`kwctl` now imports the trusted certificate authorities from the host system. Thus, `kwctl`
interactions with registries secured by certificates issued by 3rd party certificate authorities
becomes simpler.

Note, it's still possible to fine tune the certificates to be used via the [`sources.yml` file](https://docs.kubewarden.io/distributing-policies/custom-certificate-authorities#the-sourcesyaml-file).

## Changes to Kubewarden controller

The validation of `ClusterAdmissionPolicy` and `AdmissionPolicy` custom resources has been extended. The
new validation checks are able to prevent the creation of resources that do not have any `rule` specified.

We would like to thank our wonderful community for this contribution.

## Miscellaneous

Furthermore, the changelog of the main Kubewarden components (policy-server, kubewarden-controller and kwctl) are now being generated using the [release-drafter](https://github.com/release-drafter/release-drafter) project.

Starting from this release, the `Changelog` file is no longer available inside of the root of these git projects, rather
it has been made available under the release section of the individual repositories.

## Go, grab it!

We are eager to know what you think about Kubewarden and this release.

Reach out to us over our slack channel or join one of our [monthly community meetings](https://www.kubewarden.io/blog/2022/12/community-meeting/) to know more.
