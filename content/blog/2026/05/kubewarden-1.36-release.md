---
title: "Kubewarden 1.36 Release"
authors:
  - José Guilherme Vanz
date: 2026-05-15
---

The garden has a new nameplate! Kubewarden 1.36 renames the repository and
its container images, changes how PolicyServer deletion works, adds host
network support, and ships the docs on a new platform.

## Breaking changes

### Repository and container image rename

We renamed the `kubewarden-controller` repository to
[`adm-controller`](https://github.com/kubewarden/adm-controller). The old
name stopped making sense once the project grew beyond a single admission
controller.

The container images moved too:

- `kubewarden-controller` is now just `controller`
- All images live under `ghcr.io/kubewarden/adm-controller/`

For example:

```
ghcr.io/kubewarden/adm-controller/controller
ghcr.io/kubewarden/adm-controller/policy-server
ghcr.io/kubewarden/adm-controller/audit-scanner
```

We also updated the SLSA provenance and Sigstore signatures for the new
repository. If you use
[`slsactl`](https://github.com/kubewarden/slsactl) to verify image
provenance, grab the latest version. It already knows the new locations.

If you upgrade through Helm, the charts pick up the new image references
for you.

### Deleting a PolicyServer no longer removes its policies

Until now, deleting a PolicyServer also deleted every policy running on it.
That was a nasty surprise if you were reorganizing your cluster or doing an
upgrade.

In 1.36 the policies stay. When you delete a PolicyServer, its policies move
back to `Scheduled` status and wait for another PolicyServer to pick them
up.

The new
[Policy lifecycle](https://docs.kubewarden.io/explanations/policy-lifecycle)
page in the docs walks through how policies move between states.

## Host network support

Sometimes pods need to use the host network, whether the CNI is not fully
set up yet or network policies block pod-to-pod traffic on the overlay.

A
[community request](https://github.com/kubewarden/kubewarden-controller/issues/1658)
prompted us to add this. You can now run PolicyServer pods with host
networking. It is off by default because it widens the attack surface:
pods can see every network interface on the host, and webhook endpoints
become reachable from outside the cluster.

To turn it on, set `hostNetwork=true` when installing the
`kubewarden-controller` Helm chart. The controller sets
`dnsPolicy: ClusterFirstWithHostNet` automatically so in-cluster DNS keeps
working. If you run several PolicyServers on the same node, use the
`spec.webhookPort` and `spec.readinessProbePort` fields on the PolicyServer
CRD to avoid port collisions.

The [host network howto](https://docs.kubewarden.io/howtos/host-network)
has the full setup guide and security trade-offs.

## Documentation moves to Antora

[docs.kubewarden.io](https://docs.kubewarden.io) now runs on
[Antora](https://antora.org/) instead of Docusaurus.

With the admission controller and SBOMscanner both needing their own
documentation, the docs team chose Antora so each project can maintain its
own content while everything shows up on a single site.

The URLs and structure remain familiar, so existing bookmarks and links
should continue to work.

## Community contributions

[@sanjay7178](https://github.com/sanjay7178) migrated the monorepo from
the unmaintained `serde_yaml` crate to its replacement `yaml_serde`
([adm-controller#1732](https://github.com/kubewarden/adm-controller/pull/1732)).

[@AkashKumar7902](https://github.com/AkashKumar7902) landed three
improvements in our CI and release workflows: `--locked` on all Cargo
commands in the Rust policy workflows
([github-actions#298](https://github.com/kubewarden/github-actions/pull/298)),
cleanup of stale checkout workaround comments
([github-actions#301](https://github.com/kubewarden/github-actions/pull/301)),
and a fix for a race condition in ArtifactHub branch updates during policy
releases
([policies#439](https://github.com/kubewarden/policies/pull/439)).

Thank you both!

## Maintenance

The repository rename meant we also had to update the OpenSSF best practices
badge and CLOMonitor configuration, and review the FOSSA license scan results
for the new repository.

As usual, Go and Rust dependencies have been bumped to their latest versions.

# Getting in touch

Join the conversation on
[Slack](https://kubernetes.slack.com/?redir=%2Fmessages%2Fkubewarden) or
[GitHub discussions](https://github.com/orgs/kubewarden/discussions) and let us
know how you're finding Kubewarden 1.36!
