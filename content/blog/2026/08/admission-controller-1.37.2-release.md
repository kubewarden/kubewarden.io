---
title: "Admission controller 1.37.2 Release"
authors:
  - José Guilherme Vanz
date: 2026-08-17
---

Hi all! This patch release ships several fixes for the community. One of them
addresses a CVE, and the others fix usability issues in the secure supply chain
features and improve how Gatekeeper Rego runtime handle errors without
representing an actual security failure.

## AdmissionPolicy unique-name collision enables cross-namespace webhook confusion

Community security researcher [Ville Vesilehto](https://github.com/thevilledev)
found a
[problem](https://github.com/kubewarden/adm-controller/security/advisories/GHSA-m5vp-9g65-pv6v)
while testing Kubewarden's namespaced admission policies. These policies should
only evaluate resources in their own namespace. Ville's finding shows that
wasn't always true.

Every policy gets an internal identifier derived from its kind, namespace, and
name, joined with a `-` character:

```
namespaced-<namespace>-<policy-name>
```

The issue is that `-` is also a perfectly legal character inside a namespace or
a policy name. The delimiter and the data are indistinguishable, which makes
the encoding ambiguous. A legitimate policy with namespace `tenant-prod` and
name `baseline`, and a malicious policy in namespace `tenant` with name
`prod-baseline`, both encode to `namespaced-tenant-prod-baseline`. And in a
race condition the malicious policy could evaluate a request that targets the
legitimate one.

To address this issue the Kubewarden admission controller now swaps the `-`
delimiter for `.` and gives each kind a short prefix:

| Policy kind | Old identity | New identity |
|---|---|---|
| `AdmissionPolicy` | `namespaced-<namespace>-<name>` | `kw.ap.<namespace>.<name>` |
| `AdmissionPolicyGroup` | `namespaced-group-<namespace>-<name>` | `kw.apg.<namespace>.<name>` |
| `ClusterAdmissionPolicy` | `clusterwide-<name>` | `kw.cap.<name>` |
| `ClusterAdmissionPolicyGroup` | `clusterwide-group-<name>` | `kw.capg.<name>` |

`kw.ap.tenant-prod.baseline` and `kw.ap.tenant.prod-baseline`, from our example,
are used in the `MutatingWebhookConfiguration` and
`ValidatingWebhookConfiguration` configuration and can no longer be confused.
As namespaces cannot contain dots, the encoding stays unambiguous.

The controller migrates existing resources on its own, so webhooks created by
the previous version keep working until the controller replaces them, and the
leftover webhook configurations get deleted during reconciliation. There is one
deliberate exception: when two policies collide on the same legacy identity, no
legacy entry is written for it at all. Serving one of them would re-open the
exact hole we are closing. Those policies get a brief dead admission path
instead, which clears up as soon as the new webhooks are in place. This
transitional code will be removed in a few releases, so upgrade one version at
a time instead of jumping straight to a much newer release.

We in the Kubewarden team would like to thank Ville for the work helping us to
keep Kubewarden admission controller even more robust and safe for our users!

## Invalid verification config file allows silently bypassing module validation

[Arpit Jain](https://github.com/arpitjain099) found that Policy Server and
kwctl accepted signature verification configurations with an empty list. Even
though that configuration was considered valid, it didn't verify anything:

- An empty `allOf` list, or `anyOf.minimumMatches` set to `0`, made
  verification always pass, no matter what the modules' signatures looked
  like.
- An empty `anyOf.signatures` list combined with the default
  `anyOf.minimumMatches` of `1` made verification always fail, since you
  can't get 1 match out of 0 signatures.
- Setting `minimumMatches` higher than the number of entries in `signatures`
  was also accepted, even though it's not a configuration that makes sense. This
  was not reported by Arpit. But we noticed that during the fixing and decided to
  address it as well

All of these are now rejected as invalid configuration up front, instead of
quietly changing what verification actually does.

## Fail closed on invalid Gatekeeper policy responses

[Arpit Jain](https://github.com/arpitjain099) also found a gap between how
the Gatekeeper Rego runtime and the rest of Kubewarden's runtimes handle bad
responses. Gatekeeper Rego reads the policy's response as JSON from stdout
and uses it to decide whether to accept or reject the request. If that JSON
failed to parse, though, the runtime defaulted to accepting the request
anyway.

We don't think this is a security issue, more a plain bug: if an attacker
crafted a policy that exploits this, the policy would just be a no-op, same as
if the attacker hadn't deployed a policy at all. Still, that's worth worrying
about since it could be used to set up a follow-up attack. So Gatekeeper Rego
evaluation now matches every other runtime when the JSON is malformed: if it
can't parse the response, it rejects the request instead of letting it
through.

## Getting in touch

Join the conversation on
[Slack](https://kubernetes.slack.com/?redir=%2Fmessages%2Fkubewarden) or
[GitHub discussions](https://github.com/orgs/kubewarden/discussions) and let us
know how you're finding Kubewarden 1.37.2!
