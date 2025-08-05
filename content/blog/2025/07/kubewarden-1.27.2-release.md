---
title: "Kubewarden 1.27.2 Patch Release"
authors:
  - Víctor Cuadrado Juan
date: 2025-08-05
---

We have just released 1.27.2, a small patch release for `kwctl`.
This newly released kwctl version `v1.27.2` fixes 2 bugs on the
`kwctl scaffold admission-request` subcommand.

On first run, `kwctl scaffold admission-request` tries to connect to a cluster
(if it exists) via kubeconfig, and create a cache of available resource
definitions. This allows for scaffolding AdmissionRequests for CRDs in the
cluster.

Starting from 1.22, there was a bug where `kwctl` failed to create the internal
client to connect to a running cluster. This wasn't triggered if you had no
available cluster or kubeconfig or if you already had an existing cache.
Now, `kwctl` will correctly create the cache with a valid client if possible.

In addition, there was a followup bug if the cache creation failed (like when
hitting the previous bug): the command
`kwctl scaffold admission-request --operation CREATE --object example-pod.yml`
would overwrite the contents of the `--object` file, here `example-pod.yml`
with the result of the scaffolding in addition to correctly printing the result
to stdout. This doesn't happen anymore.

## Getting in touch

Join the conversation on
[Slack](https://kubernetes.slack.com/?redir=%2Fmessages%2Fkubewarden) or
[GitHub discussions](https://github.com/orgs/kubewarden/discussions) and let us
know how you’re using Kubewarden!
