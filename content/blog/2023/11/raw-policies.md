---
title: Raw policies
authors:
  - Fabrizio Sestito
date: 2023-11-14
---

Kubewarden 1.9.0 has introduced even more features requested by the community, and we are excited to share them with you!

In this blog post, we will introduce the new `Raw` policy type.

## Kubewarden as a generic policy engine

Raw policies allow policy authors to write and execute policies that are not necessarily related to Kubernetes.
This means that Kubewarden can be used as a general-purpose policy engine.
For instance, you can use Kubewarden to validate any type of artifact:
configurations, Terraform plans, test coverage, static analysis
or even deploy Kubewarden alongside your web application to validate domain-specific requests.

## Key features

Raw policies offer several key features:

- Simple API: The Policy Server exposes the `/validate_raw` endpoint, enabling the validation or mutation of _arbitrary_ JSON documents against Kubewarden policies.

- Language Agnostic: Raw policies can be written in any language that supports WebAssembly, such as Go, Rust, and Rego.

- Versatility: Raw policies provide a high degree of flexibility, allowing policy authors to define policies tailored to their specific needs.

- Standalone Execution: The Policy Server can be run outside Kubernetes as a standalone container if needed, which simplifies the deployment and execution of raw policies and the integration with other systems.

## Using the validate raw endpoint

Let's see the `/validate_raw` endpoint of a local Policy Server running on port `3000` in action:

This request is accepted:

{{<figure src="/images/raw_policy_accepted.gif" alt="raw policy accepted demo">}}

This one is rejected:

{{<figure src="/images/raw_policy_rejected.gif" alt="raw policy rejected demo">}}

This one is accepted but the request is mutated:

{{<figure src="/images/raw_policy_mutated.gif" alt="raw policy mutated demo">}}

## Conclusion

If you want to learn more about Raw policies, please check out the [how-to](https://docs.kubewarden.io/next/howtos/raw-policies).

We are excited to see how the community will use this new feature.
What are you going to build with it? We are curious to know!

Please, reach out on [Slack](https://kubernetes.slack.com/?redir=%2Fmessages%2Fkubewarden) or join
our [monthly community meeting](https://teamup.com/ks2bj74dvw132mhjtj?view=a&showProfileAndInfo=0&showSidepanel=1&disableSidepanel=1&showMenu=1&showAgendaHeader=1&showAgendaDetails=0&showYearViewHeader=1)
to share your ideas with us.
