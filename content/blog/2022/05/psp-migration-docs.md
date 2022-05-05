---
title: "Have you migrated your Kubernetes PodSecurityPolicy?"
authors:
- José Guilherme Vanz
date: 2022-05-16
---

If you use a version of Kubernetes (< v1.24) that supports the deprecated PodSecurityPolicy (a.k.a PSP), you would be
wondering what to do after the Kubernetes v1.25 version when the PSP will be removed.
With this in mind, the Kuberwarden team wrote a [documentation](https://docs.kubewarden.io/psp-migration.html)
to help users migrate away from PSPs to Kuberwarden policies.

As you know, the original Pod Security Policies had many configuration knobs.
The Kubewarden team created a series of policies that offer a 100% feature
parity with all the soon to be dropped Pod Security Policies.
This section of our [documentation](https://docs.kubewarden.io/psp-migration.html)
highlights all these policies and guides you through their recommended settings.

On this topic, do you know our helm chart provides a [flag](https://github.com/kubewarden/helm-charts/tree/main/charts/kubewarden-defaults#configuration)
that enforces a chosen selection of Pod Security Policies? This makes even easier
to keep your clusters safe!

Check it out and let us know if you have question about this!

