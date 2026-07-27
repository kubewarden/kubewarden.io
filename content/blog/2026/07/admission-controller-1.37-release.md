---
title: "Admission Controller 1.37 Release"
authors:
  - Víctor Cuadrado Juan
date: 2026-07-27
---

Here we are, at the tail end of July. Belugas are migrating up north for the
season, green turtles are moving to the islands for nesting, and spawned
sardines are moving up the east coast of Africa. Kubewarden doesn't want to
miss this season!

## Migration to new single Helm chart admission-controller-6.0.0

Since its inception, the Kubewarden Admission Controller has shipped as 3
separate Helm charts: `kubewarden-crds`, `kubewarden-controller`, and
`kubewarden-defaults`.

This was done for flexibility: it allowed cluster operators to
install/uninstall CRDs, recommended policies and PolicyServers on its own, and
bump each part of the stack separately.

It also simplified the implementation of the Helm uninstall process. Being a
dynamic admission controller with ValidatingAdmissionWebhooks and
MutatingAdmissionWehooks pointing to unlimited and user-created PolicyServers,
the stack needs a correct and staggered cleanup before removing policies,
PolicyServers or CRDs, as leaving orphaned webhooks means a Denial Of Service
on the cluster.

Like all migrations, it is a self-renewal cycle. In our case, an opportunity 
to pay tech-debt, simplify, and serve these benefits forward to our users.

For the last releases, we have put the pieces together to migrate to a single
unified chart. On the previous v1.36 we have enhanced the controller to allow
for leaving policies around, without webhooks and in a "scheduled" status, if
their PolicyServer was removed, and done internal changes to templates and
codebase.

With this release, we are happy to announce that we have greatly simplified the
deployment process by moving to a single Helm chart!

## Legacy Helm charts now deprecated (1.36)

The last 1.36 Helm charts, `kubewarden-crds-1.28.1`,
`kubewarden-controller-5.14.1`, `kubewarden-defaults-3.14.1` are now declared
deprecated via their last patch release.

A new Helm chart, `admission-controller-6.0.0`, is now available in the same
Kubewarden Helm chart repository.

## New admission-controller Helm chart (1.37)

The new helm chart deploys the same resources as the previous charts, and the
user experience is almost the same, with minor changes:

- The Values file for the new `admission-controller` Helm chart consists of the
  concatenation of the Values for the now-deprecated Helm charts. The
  `.Values.global.*` keys are present in the legacy charts, take care when
  merging to not have collisions.
- The Service `service/kubewarden-controller` has been renamed to
  `service/admission-controller`.
- In the past, recommended policies were deployed by the Helm chart. Now,
  recommended policies are deployed by the controller, with the help of an
  internal ConfigMap that is configured via the same Helm chart
  `.Value.recommendedPolicies` that were used before. 
- Before, the uninstall process was done via the staggered removal of the
  legacy charts and a Helm pre-delete-hook in the `kubewarden-controller` that
  deleted CRs. Now, the controller image has been enhanced with a `--cleanup`
  mode, and is called in the `admission-controller` pre-delete-hook. It takes
  care of removing the controller, webhooks and associated resources in a
  safe, staggered, and idempotent manner.
- On uninstall, the `admission-controller` chart now leaves behind CRDS and CRs
  deployed by users. This means that one can uninstall the chart, leaving the
  policies and PolicyServers, and reinstalling the chart will re-activate all of
  those policies. If wanted, users can delete the CRDs for a complete cleanup.
  See our [uninstall
  section](https://docs.kubewarden.io/admission-controller/1.37/en/quick-start.html#_uninstall)
  on our quick-start documentation page for more info.
  
This Helm chart change is not a small one. In addition of updating our CI/CD
end-to-end tests, we have manually tested the new chart, and we provide tested
migration documentation to simplify the life of our cluster operators.

#### New Installs of `admission-controller-6.0.0` (1.37)

No new changes here. Follow our updated
[quickstart](https://docs.kubewarden.io/admission-controller/1.37/en/quick-start.html)
for new installations.

#### Upgrading to `admission-controller-6.0.0` (1.37)

For upgrading from the 3 legacy charts in `1.36` to new the chart in `1.37`, we
provide several migrationg how-tos. We generally favour performing a backup,
reinstall and restore migration (with downtime). Depending on the user stack,
performing a manual, testable, and idempotent Helm migration is not simple. 

- [Manual migration from 1.36 to
1.37](https://docs.kubewarden.io/admission-controller/1.37/en/community-specific/howtos/migration/app136-to-app137-migration.html).
Consisting on a backup, reinstallation and restore, with a short downtime for
policy enforcement.

- [Fleet migration from 1.36 to
1.37](https://docs.kubewarden.io/admission-controller/1.37/en/community-specific/howtos/migration/fleet-migration-1.37.html).
Consisting on Fleet steps for GitOps migrations, both as a reinstallation, and
as a no-downtime migration done by adopting the resources from old charts into
the new chart.

#### Uninstalling `admission-controller-6.0.0` (1.37)
  
As mentioned above and contrary to the legacy 3 Helm charts, the new
`admission-controller` Helm chart leaves CRDs, and CRs for policies and
PolicyServers deployed by users when uninstalled. Reinstalling the chart will
re-activate all of those policies. If wanted, users can delete the CRDs for a
complete cleanup. See our [uninstall
section](https://docs.kubewarden.io/admission-controller/1.37/en/quick-start.html#_uninstall)
on our quick-start documentation page for more info.

## Air gap support

We keep shipping `imagelist.txt` and `policylist.txt` files inside our new
`admission-controller` Helm chart, but we have phased out the documentation for
air gap installs with them.

We recommend using [Hauler](https://docs.hauler.dev/docs/intro), which we already
supported for some time. Have a look at our documentation page for [air gap
with
Hauler](https://docs.kubewarden.io/admission-controller/1.37/en/howtos/airgap/02-hauler.html).

## Audit Scanner

Fixed a race condition that could wrongly mark reports as stale and remove them
as part of a new Audit Scanner run.

## kwctl

`kwctl bench` now allows context-aware policies to be benchmarked. This is done
by rewinding the recorded host-capabilities session before every iteration done
when running the `bench` subcommand.

## Security fix for trusted-repos policy v2.1.2

Our
[trusted-repos](https://artifacthub.io/packages/kubewarden/kubewarden-policy-library/trusted-repos)
policy has been updated to fix a security issue reported by the community as
`CVE-2026-63121` (CVSS severity 6.3). We thank
[@kanywst](https://github.com/kanywst) on GitHub for the responsible
disclosure.

The `trusted-repos` policy compares the registry of images against a provided
allow list or reject list. Until `v2.1.1` inclusive, in the case of a reject
list, the policy was not taking into account that DNS hosts can be
case-insensitive. For example, `EVIL-REGISTRY.COM/malware` was not matched
against a reject entry for `evil-registry.com`. This can now been fixed in
`v2.1.2`.

You can read the [security
advisory](https://github.com/kubewarden/policies/security/advisories/GHSA-8p62-9vh2-272p)
for more information.

## Documentation

Both the `kwctl` and `policy-server` binaries support outputting the CLI
reference documentation as Asciidoc, in addition to Markdown. This is done when
the filename passed in `kwctl docs --output <filename>` ends in `.adoc`.

We have also updated the 1.37 documentation to reflect the changes
to the new Helm chart.

Work continues on refactoring the documentation for more flexiblity in helping
the several Kubewarden projects and reuse of downstream consumers.

## Getting in touch

Join the conversation on
[Slack](https://kubernetes.slack.com/?redir=%2Fmessages%2Fkubewarden) or
[GitHub discussions](https://github.com/orgs/kubewarden/discussions) and let us
know how you're finding Kubewarden 1.37!
