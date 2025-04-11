---
title: Rego policy library relaunch
authors:
  - Fabrizio Sestito
date: 2025-04-22
---

We are excited to announce the latest additions to our policy library!

Seventy finely crafted Rego policies are now available for you to use in your Kubernetes clusters.

{{< figure class="center" src="/images/moar-policies.jpg" width="60%" alt="moar policies meme">}}

### Rego policy library

The Kubewarden's Rego policy library is a collection of policies written in Rego, the policy language used by Open Policy Agent (OPA).
These policies are designed to help you enforce security and compliance best practices in your Kubernetes clusters.

The library includes policies for a wide range of use cases, including:

- Containers and Pod security and compliance
- Network policy security
- RBAC configuration
- Flux specific policies

You can find the library’s GitHub repository here: [kubewarden/rego-policies-library](https://github.com/kubewarden/rego-policies-library),
and browse the complete list of available policies on [ArtifactHub](https://artifacthub.io/packages/search?repo=kubewarden-rego-policies-library&sort=relevance&page=1).

### The release flow

We organized the repository as a monorepo, where each policy is contained in its own directory.
This allows us to manage the policies independently, while still keeping them in a single repository, which speeds up the development process.
This required changes to our [reusable GitHub Actions workflows](https://github.com/kubewarden/github-actions), which are now able to build, test and publish policies contained in the monorepo.
If you are a Kubewarden policy author, and you are interested in building multiple policies in a single repository,
you can take advantage of this feature with the [latest release of Kubewarden's GitHub Actions](https://github.com/kubewarden/github-actions/releases/tag/v4.4.0)/.

### But wait, there's more...

More policies are on the way!
We are actively working on releasing more than 150 additional policies in the next few months.

Under the [`staging` directory of the library's repository](https://github.com/kubewarden/rego-policies-library/tree/main/staging), you can find a collection of policies that are still under development.
These policies are not yet ready for production use, but we encourage you to take a look and provide feedback.

### Acknowledgements

These policies have been adapted from https://github.com/weaveworks/policy-library.
Weaveworks has been a pioneer in the field of Kubernetes security and compliance.
They transitioned to a community-driven project with the closure of their start-up company at the beginning of 2024, which was a sad moment in the cloud native sphere.

We thank Weaveworks and their contributors for their work ❤️!

## Getting in touch

Are you using the new Rego policy library?
Are you interested in contributing to the Kubewarden project?

Join the conversation on
[Slack](https://kubernetes.slack.com/?redir=%2Fmessages%2Fkubewarden)
or
[GitHub discussions](https://github.com/orgs/kubewarden/discussions).

We would love to hear from you!
