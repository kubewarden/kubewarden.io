---
title: Kubewarden 2023 Wrapped
authors:
  - Flavio Castelli
date: 2023-12-20
---

The end of the year is around the corner. Let's look at what the Kubewarden project achieved in 2023!

## Context-Aware graduation

The context-aware feature graduated to stable during this year. We did this by performing a massive overhaul of the initial iteration.
Context-aware policies can access information about Kubernetes resources defined inside the cluster. At evaluation time, these policies can make decisions based on this information.
Such an example is the [unique ingress host policy](https://artifacthub.io/packages/kubewarden/unique-ingress-policy/ingress-unique-host).

Policy, by default, has no access to the cluster information. Kuberwarden administrators can grant read-only access to specific resources. The control access operates on a per-policy level, which allows fine-tuned settings for each deployed policy.

This feature is available to all kinds of Kubewarden policies, except for the WASI ones (yet). Context-aware policies written for Open Policy Agent/Gatekeeper do not need any change.

You can learn more about context-aware policies [here](https://docs.kubewarden.io/explanations/context-aware-policies).

## WASI policies

This year, we introduced a new type of policy: the WASI one. This type of policy allows to experiment with bleeding-edge WebAssembly features, which can be attractive for advanced policy authors.

We created WASI policies because we wanted to use the latest changes introduced by Go 1.21.
For example, we used a WASI policy to write [this policy](https://github.com/kubewarden/kyverno-dsl-policy) which allows the reuse of Kyverno policies.

You can learn more about WASI policies [here](https://docs.kubewarden.io/writing-policies/wasi/intro-wasi).

## Audit Scanner

Administrators enforce new policies over time and change the settings of the existing ones. A compliant resource may suddenly become non-compliant because of one of these changes.

The Audit Scanner provides continuous verification of the compliance of cluster resources. The scanner writes its results using dedicated Custom Resources: PolicyReport and ClusterPolicyReport.
The [Kubernetes Policy Working Group](https://github.com/kubernetes-sigs/wg-policy-prototypes/tree/master/policy-report) is working on the standardization of these CRDs.

You can learn more about the audit scanner [here](https://www.kubewarden.io/blog/2023/10/audit-scanner-feature/).

## Kubewarden as a generic policy engine

Kubewarden started as a policy engine for Kubernetes. Last year, we introduced a new policy deployment mode called "[raw policy](https://www.kubewarden.io/blog/2023/11/raw-policies/)". That made Kubewarden a generic policy engine.

Raw policies are regular Kubewarden policies that process arbitrary JSON data. For instance, they can validate resources such as configurations, Terraform/OpenTofu plans, test coverage, static analysis and more. Kubewarden can even be deployed alongside your web application to assess domain-specific requests.

You can learn more about raw policies [here](https://docs.kubewarden.io/howtos/raw-policies).

## Policy Evaluation timeout

We improved Kubewarden's reliability with the introduction of policy evaluation timeouts.
Policy Server now limits the duration of a policy evaluation. This prevents policy bugs from overloading the computation resources of a Policy Server instance.

You can learn more about policy evaluation timeout [here](https://docs.kubewarden.io/operator-manual/policy-evaluation-timeout).

## Improving the developer experience of Go policy authors

Thanks to advancements in the [TinyGo compiler](https://tinygo.org/), the [`easyjson` library](https://github.com/mailru/easyjson/) is not used anymore to handle the serialization and deserialization of JSON data. Authors can now rely on the traditional encoding/json module offered by the Go standard library.

## What's next?

We would love to hear more from you, our community. We have created [this short anonymous survey](https://docs.google.com/forms/d/e/1FAIpQLSd1TLjRzH1LNO1RXJA_Kgi6uHFoJhq9sM5OgOqyIldodgeSNg/viewform) to collect your suggestions.

The survey takes just a few minutes to complete. We will use it to shape our roadmap and organize our priorities.

We're planning to apply for CNCF incubation next year. If you run Kubewarden in production, please add your name to our
[`ADOPTERS`](https://github.com/kubewarden/kubewarden-controller/blob/main/ADOPTERS.md) file. It will help us during the graduation process.
