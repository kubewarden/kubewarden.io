---
title: Ensuring the chain of custody of your policies
authors:
- José Guilherme Vanz
date: 2022-04-13
---

Ensuring the software artefacts' chain of custody is an issue with no clear and
standard solution. In other words, it can be difficult to make sure that the
piece of software you are using comes from the people that you trust. This is
called Secure Supply Chain. This means that you should be able to verify if the
if the binaries or file that you are running come from the right place. This is
where [Sigstore](https://www.sigstore.dev/) comes to help. The project aim is
to provide the tools and infrastructure to allow developers to sign their
products and user to check if what they have come from where they expect.

The Kubewarden team are happy to announce that now you can check if the policies
that you are running are signed by people that you trust. The Kubewarden team
worked together with the Sigstore project to allow its users to ensure the origin
of their deployed policies.

Since Kubewarden controller version v0.5.2 and Policy Server version v0.2.7 is
possible to define what are the minimum required signatures necessary to allow
a policy to run in the cluster. Furthermore, the team are also working to release
a policy where users can check if the container images used in the applications
running in the cluster are also signed by trusted entities. And, of course, all
the Kubewarden policies are already signed by the Kubewarden organization. ;)

If you need more information about how to use it, please check our documentation out!


