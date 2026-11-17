---
title: "Admission controller 1.39 Release"
authors:
  - Víctor Cuadrado Juan
date: 2026-11-17
components:
  - Admission Controller
types:
  - release
  - security-advisory
---

The Admission Controller took some time this November to get cozy with a warm
drink or an icey drink, depending on where you have it deployed, some chill
vibes music, and a plated selection of bug fixes and features to snack on.
Let's share!

## Advisory: fail to reload PolicyServer certificate with mTLS (CVSS 2.3 score) 

Shiran Guez (`sguez` in GitHub) reported to us this security advisory
[`GHSA-g62h-p6qf-949g`](https://github.com/kubewarden/adm-controller/security/advisories/GHSA-g62h-p6qf-949g)
(CVE pending from GitHub since 22th of October).

For Admission Controller versions `1.32.0` through `1.38.0`, when mutual TLS is
enabled, the Kubewarden PolicyServer stops reloading the client CA file from
disk after the first update of the mounted Secret. That is, when any of the
following happens:
- a scheduled refresh of the CA file happens (every 10 years for the CA, every
1 year for the leaf certificates)
- or if an administrator removes a client CA manually the CA certificate is not
refreshed/

In that case, PolicyServers will continue serving a stale certificate until it
expires. Since PolicyServer defaults to fail-closed admission webhooks, those
will be unavailable until a manual rotation of the certificate.

This happened because our PolicyServer Pods watched for each mounted TLS file
with Linux inotify using only `IN_CLOSE_WRITE`, but Kubernetes does not update
mounted Secrets in place, it actually moves the `..data` Symlink of the Secret
to a new directory, and removes the old directory. The old watched directory
inode emits `IN_IGNORED`, which permanently removed the Inotify watch.

This is now fixed as part of `v1.39.0`. The Inotify watches are now correctly
set.

We thank Shiran for this responsible disclosure.

## Admission Controller now controls all certificates, Secrets, and wehbooks

We took time this release cycle to strenghten our certificate history.
Before, for the first install, Helm chart took care of generating the first CA
certificate, creating the certificate Secret, and creating the
ValidatingWebhookConfiguration and ValidatingWebhookConfiguration that are used
for our Custom Resources (policy definions such as ClusterAdmissionPolicy, and
PolicyServers). For subsequent Helm upgrades, our controller took ownership of
rotating the CA certificate, and writing it in the respective Secret.

This is an usual pattern for installations, but certain GitOps tools throw a
wrench to it. For example, ArgoCD doesn't use Helm to render and install the
templates as normal against a running Kubernetes cluster. It instead renders
all the Helm templates in a vacuum, and then applies them. Which means that our
chart cannot query the cluster to see if there's already a CA certificate that
doesn't need to be rotated nor overwritten.

Therefore, for this release we have decided to refactor our certificate story.
Now, the admission controller takes care of generating all the needed
certificatess (CA, and leaf certs), create the Secret, and create the needed
Webhooks once the certificates are in place (so mutualTLS can work correctly).

For achieving that, we have added 2 new modes to the controller binary:

- `init` mode: Runs in a new init container. It generates the needed
certificate Secrets, creates or updates the 2 webhook configurations of the
controller, and waits until the Kubelet mounts the certificate of the
Kubernetes webhook server into the needed Pods. That way our controller
will be ready to reconcile our CRDs.
- `pre-upgrade` mode: Runs in a Helm pre-upgrade hook. It adds
helm.sh/resource-policy: keep and the Argo CD sync option Prune=false to the
five objects that older charts render. This is only needed for the migration
upgrade from the old approach (`v1.38.0`) to the new one (`v1.39.0`), and will
be dropped in the near future.

Our Helm chart takes care of deploying the controller in the new modes, to
ensure a correct migration of all certificates to the new workflow.
This refactor greatly simplifies the reasoning between our chart and the
controller.

We have updated our documentation with an expanded [explanation of our
certificate
story](https://docs.kubewarden.io/admission-controller/1.39/en/explanations/certificates.html),
and also added a new page on how to recover from  [certificate
problems](https://docs.kubewarden.io/admission-controller/1.39/en/howtos/certificate-recovery.html).
Nobody deserves to rush for understanding if something in the cluster is not as
peachy as it should!

### ArgoCD install simplified

With this refactor, deploying Admission Controller with ArgoCD is now done without
any special change. There's no need anymore to configure ArgoCD to use
`spec.syncPolicy.syncOptions[RespectIgnoreDifferences] = true`, as ArgoCD can just
render the Helm templates and apply them: our controller takes care of the stateful
logic of rotating the CA and Secret when needed.

Have a look at our refreshed [ArgoCD installation](https://docs.kubewarden.io/admission-controller/1.39/en/howtos/argocd-installation.html
) documentation page.

## Fix old policy webhook configurations left behind

Before, when you changed the
[`spec.mutating`](https://docs.kubewarden.io/admission-controller/1.38/en/reference/CRDs.html#k8s-api-github-com-kubewarden-adm-controller-api-policies-v1-policyspec)
field of a policy, the controller created a webhook configuration of the new
kind, but it did not delete the configuration of the old kind. When you deleted
the policy, the controller deleted only the configuration of the current kind.

The leftover configuration continues to send requests to the PolicyServer, but
the PolicyServer no longer serves the deleted policy. If the policy uses
`failurePolicy: Fail` (the default), the API server rejects all the requests
that match the policy rules. Depending on the scope of the policy, this can
block operations in the full cluster.

It is not usual to change `spec.mutating` on an existing policy:
`kwctl scaffold manifest` sets the correct value from the policy metadata.

Now, the controller deletes the configuration of the old kind each time it
reconciles a policy. It also deletes both kinds when you delete a policy. After
the upgrade, the controller removes the leftovers of all the existing policies.

It does not remove the leftovers of policies that you deleted before the
upgrade. To remove these leftovers, delete all the policy webhook
configurations. The controller creates the configurations of the existing
policies again:

```console
kubectl delete validatingwebhookconfigurations,mutatingwebhookconfigurations \
  -l 'app.kubernetes.io/part-of=kubewarden,!app.kubernetes.io/component'
```

Until the controller creates the webhook configurations again, the policies do
not check requests.

## Run CEL policies directy by compiling CEL to Wasm

We are proud to announce that `kwctl` can now compile existing CEL policies
(Kubernetes ValidatingAdmissionPolicies, or other CEL policies in the wild)
right into WebAssembly, so they can be run in our PolicyServers.

This an alternative approach to our already existing [CEL
policy](https://artifacthub.io/packages/kubewarden/kubewarden-policy-library/cel-policy),
that runs policies using the official CEL Go interpreter.

Being new, we are marking it as experimental on its first release for this
`v1.39.0` release. You can read more about it in its [new documentation page](
https://docs.kubewarden.io/admission-controller/1.39/en/tutorials/writing-policies/CEL/02-compile-cel-to-wasm.html).

We feel this is a great feature that opens new posibilities for us, and as such
you will be reading more of it as it deserves its own dedicated blog post!

## One policy monorepo for cozy times

Before, the code for policies maintained by the Kubewarden team was distributed
between github.com/kubewarden/policies (a monorepo for policies written in
several languages) and github.com/kubewarden/rego-policies-library, a monorepo
for policies written in Rego.

Now, we have moved all policies code under 1 (one!) monorepo for all:
    https://github.com/kubewarden/policies.

This repository contains now policies written in Go, TinyGo, Rego, (OPA and
Gatekeeper), Rust, and "meta policies" such as the [CEL
policy](https://artifacthub.io/packages/kubewarden/kubewarden-policy-library/cel-policy)
or the [Kyverno DSL
policy](https://artifacthub.io/packages/kubewarden/kubewarden-policy-library/kyverno-dsl).
Policy authors can still find template repos for each kind of language we
provide an SDK for in dedicated repos.

We also took the time to provide SBOMs for each policy build.

As usual, you can find the policies maintained by the team (among others) in 
[ArtifactHUB](https://artifacthub.io/packages/search?kind=13&sort=relevance&page=1).

## Other improvements and bug fixes 

- The `kwctl` binary now is built at SLSA Level 3, and its SBOM now only has
the kwctl dependencies and no dependencies of the other things in the Rust
workspace.
- All containers run in read-only root filesystems for increased security.
- The Audit Scanner now correctly follows the scope field of rules of policies,
and doesn't scan resources that the admission controller would have never
policed.
- Furher simplified our usage of Renovatebot and Updatecli for our dependency
maintenace.
- Our Helm chart HTTPS repo (https://charts.kubewarden.io) got duplicate
entries of RC builds removed.
- Our documentation gained more templating and reorganization, to simplify
adding the new content for our new components such as Network Enforcer and
Runtime Enforcer!

## Getting in touch

Join the conversation on
[Slack](https://kubernetes.slack.com/?redir=%2Fmessages%2Fkubewarden) or
[GitHub discussions](https://github.com/orgs/kubewarden/discussions) and let us
know how you're finding Kubewarden 1.39!
