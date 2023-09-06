---
title: kwctl SHA support
authors:
  - Fabrizio Sestito
date: 2023-09-28
---

Recently, we have focused on improving the Kubewarden developer experience.
We have been implementing features requested by the community.

# Reference policies by their SHA

Since `kwctl` release `v1.7.0` we support referencing policies by their SHA.

Container engines such as Docker and Podman allow users to refer to images by their SHA sum.

As Kubewarden policies are distributed as OCI artifacts, we thought it would be a good idea
to add the SHA support to `kwctl`, so that users have a familiar experience.

Now, you can use a SHA prefix to refer to a policy which was previously pulled, and `kwctl` automatically resolves its full SHA.
It's still possible to refer to a policy by its URI, or use a command against a local policy via a relative or absolute file path.

Here is an example of the new feature in action:

{{<figure src="/images/kwctl_sha.gif" alt="kwctl sha support demo">}}

# Give it a try!

You can update `kwctl` to the latest version `v1.7.0` by using your [package manager] https://github.com/kubewarden/kwctl#install
or via [GH releases](https://github.com/kubewarden/kwctl/releases/tag/v1.7.0).

Please, reach us out on [Slack](https://kubernetes.slack.com/?redir=%2Fmessages%2Fkubewarden) or join
our [monthly community meeting](https://teamup.com/ks2bj74dvw132mhjtj?view=a&showProfileAndInfo=0&showSidepanel=1&disableSidepanel=1&showMenu=1&showAgendaHeader=1&showAgendaDetails=0&showYearViewHeader=1)
to talk more about Kubewarden!
