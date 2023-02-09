---
title: Kubewarden UI 1.0.0 is released!
authors:
- Jordon Leach 
date: 2023-02-09
---

We are excited to announce that the Kubewarden UI 1.0.0 has been released!

The UI is an Extension for [Rancher Manager](https://github.com/rancher/rancher/), now you will be able to enable Kubewarden policies for your Kubernetes clusters with a streamlined user experience. You can find the latests releases of the extension Helm chart [here](https://github.com/kubewarden/ui/releases/), the release provides a [Github Pages deployment](https://kubewarden.github.io/ui/) which can be used when adding the UI as a Helm repository.

Currently Rancher is required to run this extension, however, in the future it will be possible to deploy the same UI as a stand-alone platform.

> **Note:** This requires a Rancher version of `v2.7` or greater

Let's see what is achievable from the UI as a Cluster Admin.

## Installing Kubewarden

With Extensions enabled in Rancher Dashboard and the option to add the Rancher Extensions Repository enabled, the "Kubewarden" menu item will appear automatically. Click on this item to install the extension. Once installed there will be a new side-navigation item within your cluster for Kubewarden, which provides a walkthrough to guide you through the installation of the `kubewarden-controller`.

Documentation to install the extension can be found [here](https://docs.kubewarden.io/operator-manual/ui-extension/install). 

We provide a structured installation of Kubewarden and the prerequisites through the UI:

{{<video src="/images/ui/ui-install.mp4" type="video/mp4">}}

## Manage Policy Servers

All of your Policy Servers are listed in an overview page with readily available details of each resource including the status of related policies:

{{<figure src="/images/ui/policyserver-list.png" alt="policy servers list view">}}

Click through one of your Policy Servers to get a detailed view of:

- Related policies with their type of policy, current mode, and their statuses
- Tracing logs for policy evaluations on their respective resources - powered by OpenTelemetry and Jaeger
- Metrics dashboard - powered by Grafana
- Configuration of the Policy Server

{{<figure src="/images/ui/policyserver-detail.png" alt="policy server detail view">}}

Create a new Policy Server or edit the configuration of an existing one with the ability to use the UI inputs or edit the Yaml directly:

{{<figure src="/images/ui/policyserver-create.png" alt="policy server configuration">}}

## Create/Edit Policies

Adding policies is as simple as choosing from a list of policies that are hosted on [artifacthub.io](https://artifacthub.io/packages/search?kind=13) or using your own pre-configured policy:

{{<video src="/images/ui/ui-create-policy.mp4" type="video/mp4">}}

## Monitor Policies

Manage both ClusterAdmissionPolicies and AdmissionPolicies with detailed views for each. View the rules that are configured for each policy along with their specific tracing logs:

{{<figure src="/images/ui/policy-detail.png" alt="admission policy detail view">}}

## What's next?

As this is the first iteration of the UI there are many improvements that can be made. With the advent of Kubernetes `v1.25` and the removal of PSPs, an intuitive and simple to use UI for managing and enforcing policies is essential.

We plan to convert the UI into a standalone program to be used without requiring an instance of Rancher Manager is a top priority. 

We want to give admins the ability to designate their own registry as a list of policies to choose from when creating a ClusterAdmissionPolicy or AdmissionPolicy.

There are many additions we can make to the UI and this is just the beginning. Follow along our progress from the [UI repository](https://github.com/kubewarden/UI).