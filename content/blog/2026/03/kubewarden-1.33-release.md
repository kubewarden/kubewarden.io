---
title: "Kubewarden 1.33 Release"
authors:
  - Víctor Cuadrado Juan
date: 2026-03-03
---

This release is an important one, with deprecations, and features galore.

## Deprecation of old context-aware API calls

The following host-callback API calls, which have been marked as deprecated for a
long time, have been removed: `kubernetes/ingresses`, `kubernetes/namespaces`,
`kubernetes/services`. These allowed reading Ingresses,
Namespaces, and Services resources.

These host-capabilities have already been superseded for a long time by
`kubewarden/kubernetes/list_resources_by_namespace`,
`kubewarden/kubernetes/list_resources`, and
`kubewarden/kubernetes/get_resource`. They provide similar capabilities while
being more fine-grained. These current host-capabilities are part of Kubernetes
capabilities listed in our
[docs](https://docs.kubewarden.io/reference/spec/host-capabilities/kubernetes).

The removed calls were not being exercised by any Kubewarden SDK.

## Deprecation of `wgk8spolicy.io` in favour of OpenReports

Since `v1.30` [we have optionally supported
OpenReports](https://www.kubewarden.io/blog/2025/10/kubewarden-1.30-release/)
as an output report format of our Audit Scanner. In that release we marked the
`wgk8spolicy.io` PolicyReports CRDs as deprecated, but we kept installing them
by default.

With this release, we are defaulting to OpenReports instead. The CRDs for
`wgk8spolicy.io` PolicyReports are not installed by default anymore by the
`kubewarden-crds`, only the new OpenReports. The Audit Scanner is configured to
produce OpenReports by default now.

Users wishing to maintain the previous behavior need to:
- Change the `kubewarden-crds` Helm chart value of
  `.Values.install.installPolicyReportCRDs` to `true`.
- Change the `kubewarden-controller` Helm chart value of
  `.Values.auditScanner.reportCRDsKind` from `openreports` to `policyreport`.

Old existing `wgk8spolicy.io` reports CRs will be removed when performing the
upgrade, as the CRDs for them are removed. In the case that the user had
installed the `wgk8spolicy.io` CRDs by other means, if the Audit Scanner is
configured to create OpenReports (the new default), upon each scan, it performs
a one-time cleanup of old `wgk8spolicy.io` PolicyReports and
ClusterPolicyReports that were created by Kubewarden. This cleanup is
performant.

In a future release, the option to create `wgk8spolicy.io` PolicyReports
and their optional CRDs installation will both be removed.

The included sub-chart for policy-reporter already supports OpenReports and
continues to function for both the deprecated `wgk8spolicy.io`
PolicyReports and OpenReports without any reconfiguration.

## Support for custom Sigstore trust roots and BYO-PKI in policy-server

Since `v1.31` release, [`kwctl` accepts the new Sigstore ClientTrustConfig
format](https://www.kubewarden.io/blog/2025/11/kubewarden-1.31-release/), also
know as "Bring Your Own PKI (BYO-PKI)". This allows to consume a single JSON
configuration file with all the certificates, URLS and information to perform
Sigstore signing and verifications.

For this release, we have enhanced `policy-server` with the same feature. Users
that want to use PolicyServers against their own custom Rekor and Fulcio
services (like those inside an air-gap) can now set the PolicyServer
`spec.sigstoreTrustConfig` to the name of a ConfigMap that contains this JSON
configuration.

The ConfigMap must contain the JSON in a key named `sigstore-trust-config`, and
it must be in the same Namespace as the PolicyServer.

For the default PolicyServer, installed via the `kubewarden-defaults` Helm chart,
the ConfigMap name can be configured via its `.Values.sigstoreTrustConfig`.

Have a read at our new [documentation
page](https://docs.kubewarden.io/howtos/policy-servers/private-sigstore) on how
to configure this feature.

## Field mask filtering for Kubernetes context aware calls

When policies perform queries about Kubernetes resources via context-aware
calls, the resulting object may be particularly big, and sometimes the policy
author only cares about a subset of the data. For example, a policy reasoning
about Pods may only be interested in the `spec.containers.image` and not the
full Kubernetes object, with its versions and fields.

To improve performance, we have enhanced our Kubernetes context aware calls
with an optional `field_masks` field that prunes the Kubernetes resource to
contain *only* the specified fields.

Our [image-cve-policy](https://artifacthub.io/packages/kubewarden/kubewarden-policy-library/image-cve-policy),
exercised by our SBOMscanner project, now makes use of this feature. This
reduces its memory usage and serialization overhead when it processes
VulnerabilityReport CRs, as they can be quite big and the policy doesn't need
the whole of it.

### Updated SDKs and cel-policy

We have enhanced our Policy SDKs to expose this new field mask feature. Policy
SDK authors can also find this new `field_masks` input field in the Kubernetes
[host-calls](https://docs.kubewarden.io/next/reference/spec/host-capabilities/kubernetes#operation---list_resources_all).

In addition, we have enhanced our
[cel-policy](https://artifacthub.io/packages/kubewarden/kubewarden-policy-library/cel-policy),
and exposed this feature as a native CEL function, `<Client>.fieldMask(<string>)`.
You can read more in the [go CEL docs](https://github.com/kubewarden/policies/blob/main/policies/cel-policy/internal/cel/library/kubernetes.go#L70-L90)
of the policy.

As an example, the following CEL code returns the `nginx` Pod with only its
`metadata.labels` field:

```cel
	kw.k8s.apiVersion('v1').kind('Pod').namespace('default').fieldMask('metadata.labels').get('nginx')
```

This new `.fieldMask()` function can be called multiple times to add several
field paths to the mask. For example, this returns a list of Pod resources with
only their `metadata.name` and `medata.namespace` fields:

```cel
kw.k8s.apiVersion('v1').kind('Pod').fieldMask('metadata.name').fieldMask('metadata.namespace').list()
```

## Configuring policies to run in the kubewarden namespace

By default, the Kubewarden admission controller is configured so *all policies*
pass in the namespace in which the controller is running (usually, `kubewarden`).

This prevents the user from locking the cluster if they misconfigure policies,
or interfering with the PolicyServers there. For example, expecting *all*
container images to be signed by Issuer `my.corp` would make the Deployment of
the Kubewarden Admission Controller eventually fail, as its container images
are signed by the Kubewarden team. Or mutating PolicyServers, which may affect
not only their desired PolicyServers but others.

In some cases though, users may want to run policies in the namespace of the
Admission Controller, for example if aiding resource allocation or preventing
core namespaces from being modified.

For those really unusual cases, cluster operators can now deploy Kubewarden
policies to also apply to the Admission Controller namespace by doing the following:
- Configure the Admission Controller to accept AdmissionReviews for policies in
  the controller namespace by setting the `kubewarden-controller` Helm chart
  values `.Values.alwaysAcceptAdmissionReviewsOnDeploymentsNamespace` to `false`.
  This means that both clusterwide and namespaced policies may apply to the
  namespace where the Deployments for the controller and PolicyServers are.
- If deploying clusterwide policies, do so with their new
  `spec.allowInsideAdmissionControllerNamespace`to `true`.

We expect cluster operators to rarely use this feature. We
recommend caution when doing so. If interested, you can see our [documentation
page](https://docs.kubewarden.io/howtos/policies-eval-resources-in-controller-namespace)
for it.

## Proxy configuration

Both `kwctl` and `policy-server` support now proxy configuration via either the
usual environment variables `HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY`  (and their
lowercase counterparts), or via the `sources.yaml` file.

This proxy configuration routes policy pulling and pushing, as well as those
context-aware capabilities that make use of the network, such as obtaining an OCI
image digest or Sigstore operations. Read more about it in our
[how-to](https://docs.kubewarden.io/howtos/proxy-configuration) docs.

## Versioning of the policy-server cert Secret

Starting with this release, the Secret that contains the PolicyServer
certificate is now versioned via an annotation, to ease maintenance and
future migrations. This means that on first install/upgrade of this release,
the Secret and certificate will be automatically recreated to match this new
scheme. This doesn't affect users.

## Monorepo cleanup continues

Our monorepo is sailing strong, and we couldn't be happier!

We have restored test coverage submission for our Rust crates, which brings us
back to [our usual ~80%
coverage](https://app.codecov.io/github/kubewarden/kubewarden-controller). We
also have automation back for Rust toolchain updates, spell checking,
contribution docs, and a general cleanup.

# Getting in touch

Join the conversation on
[Slack](https://kubernetes.slack.com/?redir=%2Fmessages%2Fkubewarden) or
[GitHub discussions](https://github.com/orgs/kubewarden/discussions) and let us
know how you’re finding Kubewarden 1.33!
