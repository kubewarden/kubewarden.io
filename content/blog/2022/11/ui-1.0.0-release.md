---
title: Kubewarden UI 1.0.0 is released!
authors:
- Jordon Leach 
date: 2022-11-01 # TODO: Update date before publishing
---

We are excited to announce that the Kubewarden UI 1.0.0 has been released!

The UI is an Extension for [Rancher Manager](https://github.com/rancher/rancher/), now you will be able to enable Kubewarden policies for your Kubernetes clusters with a streamlined user experience.

Let's take a look at what is achievable from the UI as a Cluster Admin.

## Manage Policy Servers

All of your Policy Servers are listed in an overview page with readily available details of each resource including the status of related policies.

{{<figure src="/images/ui/policyserver-list.png" alt="policy servers list view">}}

Click through one of your Policy Servers to get a detailed view of:

- Related policies with their type of policy, current mode, and their statuses   
- Tracing logs for policy evaluations on their respective resources
- Metrics dashboard powered by Grafana
- Configuration of the Policy Server

{{<figure src="/images/ui/policyserver-detail.png" alt="policy server detail view">}}

Create a new PolicyServer or edit the configuration of an existing one with the ability to use the UI inputs or edit the Yaml directly.

{{<figure src="/images/ui/policyserver-create.png" alt="policy server configuration">}}

## Create/Edit Policies

Manage both ClusterAdmissionPolicies and AdmissionPolicies with detailed views for each. View the rules that are configured for each policy along with their specific tracing logs.

{{<figure src="/images/ui/policy-detail.png" alt="admission policy detail view">}}

Adding policies is as simple as choosing from a list of policies that are hosted on [artifacthub.io](https://artifacthub.io/packages/search?kind=13) or using your own pre-configured policy.

{{<figure src="/images/ui/policy-create.png" alt="create a policy">}}

## What's next?

As this is the first iteration of the UI there are many improvements that can be made. With the advent of Kubernetes `v1.25` and the removal of PSPs, an intuitive and simple to use UI for managing and enforcing policies is essential.

We plan to convert the UI into a standalone program to be used without requiring an instance of Rancher Manager is a top priority. 

We want to give admins the ability to designate their own registry as a list of policies to choose from when creating a ClusterAdmissionPolicy or AdmissionPolicy.

There are many additions we can make to the UI and this is just the beginning. Follow along our progress from the [UI repository](https://github.com/kubewarden/UI).