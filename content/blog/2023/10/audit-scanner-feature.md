---
title: Welcoming the Audit Scanner
authors:
  - Víctor Cuadrado
date: 2023-10-05
---

Fresh in the already released Kubewarden `v1.7.0` stack, we welcome a new module:
the Audit Scanner!

## Audit Scanner?

Up until the release of Audit Scanner, Kubewarden was strictly a Dynamic Admission
Controller, checking requests made against the Kubernetes API server with the
deployed policies.

Yet policies evolve over time; new ones are deployed, and existing ones are
updated. This can mean that resources that are inside the cluster are no longer
compliant. A resource that was compliant some weeks ago, today may not be valid
since the introduction of a new policy.

Now with the new Audit Scanner, Kubewarden provides continous verification on
the compliance of cluster resources. The new Audit Scanner module is called via a
Kubernetes `Cronjob`, which spawns the jobs that audit the cluster resources.

#### Ok, but how does it work?

The Audit Scanner looks at all the deployed policies, and for each, at which
cluster resources are involved. It builds tuples of `(policy,
synthetic_admission_request)` that match those audited resources, simulating
operations to the resources.
It then iterates through the tuples, sending to the respective PolicyServers the
`policy` and `synthetic_admission_request` to evaluate.

Notice how the `synthetic_policy_requests` don't hit the Kubernetes API server;
there's no need, as no resource is actually being CREATEd, UPDATEd, or DELETEd.
Instead, the `synthetic_policy_request` is consumed by the PolicyServer. But
not on its usual `validate/` HTTP endpoint, but in a different `audit/`
endpoint, exclusively for audit requests. This `audit/` endpoint evaluates the
policy in exactly the same way as the `validate/` one, and is instrumented as
well, which provides separation of concerns from the normal validation of
policies.

Once the Audit Scanner has the audited results, it writes its findings using
two new types of Kubernetes Custom Resources: `PolicyReport` and
`ClusterPolicyReport`, [from the K8s Policy Working Group](https://github.com/kubernetes-sigs/wg-policy-prototypes/tree/master/policy-report).

Each Kubernetes Namespace inspected by the Audit Scanner will feature one
`PolicyReport` object that contains the results of the audit. For cluster-wide
resources (like Namespace, PersistentVolume, &hellip;) the Audit Scanner
creates one `ClusterPolicyReport` object per cluster.

There are some resources that the Audit Scanner cannot audit in this first
implementation. For example, it cannot simulate UPDATE requests, as it doesn't know
exactly which part of the resource needs to be changed in a meaningful way.
Also, the DELETE requests will be synthesized in the future. Read the
[limitations](https://docs.kubewarden.io/explanations/audit-scanner/limitations)
doc for an expanded explanation. The full [explanation docs
page](https://docs.kubewarden.io/explanations/audit-scanner) has further explanation.

The new Audit Scanner brings all this functionality while keeping in line with the
modular architecture of Kubewarden. It allows operators to scale it as needed,
configure its periodicity, monitoring and tracing, and making sure it doesn't
influence the PolicyServers in a bad way.

#### Fine, but what about a UI?

Reading `(Cluster)PolicyReports` sounds cumbersome?

Don't worry, the community has created the nice [Policy Reporter UI
project](https://kyverno.github.io/policy-reporter), which provides a view on
the reports and ways to filter them. `Screenshot >= 1000*word`:

{{<figure src="/images/audit-scanner/policy-reporter-ui.png" alt="policy-reporter-ui view"  >}}

We have elected to include the `policy-reporter-ui` chart in our
`kubewarden-controller` chart as a subchart. It is disabled by default, have a
look at our [Audit Scanner install
docs](https://docs.kubewarden.io/howtos/audit-scanner) to see how to enable it.

Policy Reporter UI is not the only tool that can consume results from the
PolicyReports. More and more tools are consuming PolicyReports themselves,
which is great for the community and the policy engines.

## Do I need to change anything?

No 🙂.

With `1.7.0`, the Audit Scanner is enabled by default. You will notice a new
`audit-scanner` Cronjob that runs and creates the `(Cluster)PolicyReports`.

If you wish, you can configure its behavior: have a look at the
`kubewarden-controller` values.yaml, under the `auditScanner` key.

The Audit Scanner needs a default `ServiceAccount` to gather the resources for
scan, and by default we provide one bound to the `view` `ClusterRole` provided
by Kubernetes, which allows read-only access to resources. You can fine-tune
and [provide yours](https://docs.kubewarden.io/explanations/audit-scanner#permissions-and-serviceaccounts).

## What about the policies?

Every policy has now a new `spec.backgroundAudit` that is `true` by default, and
get evaluated by the Audit Scanner:

```console
$ kubectl get clusteradmissionpolicies
NAME                        POLICY SERVER   MUTATING   BACKGROUNDAUDIT   MODE      OBSERVED MODE   STATUS   AGE
do-not-run-as-root          default         true       true              monitor   monitor         active   99s
do-not-share-host-paths     default         false      true              monitor   monitor         active   99s
drop-capabilities           default         true       true              monitor   monitor         active   99s
no-host-namespace-sharing   default         false      true              monitor   monitor         active   99s
no-privilege-escalation     default         true       true              monitor   monitor         active   99s
no-privileged-pod           default         false      true              monitor   monitor         active   99s
                                                        🠉
                                                        new spec.backgroundAudit
```

If you want to skip a policy evaluation, you should set `spec.backgroundAudit`
to `false`.

And if you want to provide more metadata, you can use two new special annotations:
`io.kubewarden.policy.severity` and `io.kubewarden.policy.category`. Have a
look at [the
docs](https://docs.kubewarden.io/explanations/audit-scanner#policies) for their
values.

## tl:dr;

The new Audit Scanner allows administrators to quickly asses the compliance
level of their clusters with Kubewarden. It does so while keeping in line with
the existing modular architecture. It allows operators to scale it as needed,
configure its periodity, its monitoring and tracing, and make sure it doesn't
influence the PolicyServers in a bad way. We look forward to new policies that
take advantage of it!

As always, we are curious as to which features you would like next and how you are
enjoying Kubewarden. Reach out to us on [slack](https://kubernetes.slack.com/?redir=%2Fmessages%2Fkubewarden)
or join our [monthly community meeting](https://teamup.com/ks2bj74dvw132mhjtj?view=a&showProfileAndInfo=0&showSidepanel=1&disableSidepanel=1&showMenu=1&showAgendaHeader=1&showAgendaDetails=0&showYearViewHeader=1)
to talk more about Kubewarden!
