---
title: Kubewarden 1.21.1 patch release
authors:
  - Flavio Castelli
date: 2025-02-05
---

Today we published the 1.21.1 patch releases of the kwctl and Policy Server components of the Kubewarden stack.

The release ensures all Sigstore verification capabilities work.

## What happened

On Monday, February 3rd, the contents of Sigstore's TUF repository were updated. During this process, part of the
repository metadata wasn't properly handled. Specifically, one of the [`KEYID`](https://theupdateframework.github.io/specification/latest/#role-keyid)s
of the repository wasn't updated when the key contents were modified.

The breaking change wasn't noticed by upstream maintainers as the TUF Go implementation
is not performing strict verification of the `KEYID`.
 
## The impact

The breaking change caused both kwctl and Policy Server to discard the contents of TUF's repository as we fail-closed. That caused all the Fulcio and Rekor
features to break.

## The fix

While collaborating with Sigstore to fix this issue, we patched the underlying libraries used by kwctl and Policy Server
to bypass the `KEYID` verification. This **does not** impact the security of
Kubewarden, as this verification step will soon be removed from the TUF specification (see this
[TUF enhancement proposal](https://github.com/theupdateframework/taps/blob/master/tap12.md)). This is why the TUF implementations
for Go and Python (and probably others) do not perform a strict verification of the `KEYID`.

## Preventing this in the future

The contents of Sigstore's TUF repository are changed using GitHub's pull requests. A new test has been introduced
to gate the merging of pull requests that would cause the Sigstore Rust client to break.

## What you should do

You can download the latest version of `kwctl` from its [GitHub releases page](https://github.com/kubewarden/kwctl/releases) or
you can use package managers like `brew` to update it.

The Kubewarden helm charts have been updated to consume the latest version of the Policy Server container image. Doing a `helm upgrade`
is enough to get the latest version of the Policy Server.

## Getting in touch

As always, we welcome your feedback and contributions. Feel free to reach out
to us on [Slack](https://kubernetes.slack.com/?redir=%2Fmessages%2Fkubewarden)
and [GitHub discussions](https://github.com/orgs/kubewarden/discussions).

