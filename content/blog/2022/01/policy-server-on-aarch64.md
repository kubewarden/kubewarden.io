---
title: Policy Server on aarch64
authors:
    - Rafael Fernández López
date: 2022-01-21
---

We recently got notified that the `policy-server` [was crashing in an
aarch64
environment](https://github.com/kubewarden/docs/issues/75). The moment
in which it got a request from the API server, it crashed immediately
with a SIGSEGV signal.

We figured out that this was only happening when the request was a TLS
one, and that the problem was related to the OpenSSL stack and the way
we were producing the final image of the `policy-server` with the
OpenSSL stack.

The good news is that we took this opportunity to migrate the
`policy-server` from OpenSSL to
[`rustls`](https://github.com/rustls/rustls). As a result, the
`policy-server` container image has been greatly simplified.

Other Kubewarden components have also been revamped to use
`rustls`. More on that on a future blog post.

We would like to thank the [`appvia`](https://github.com/Appvia) team
for their contributions to the project and the valuable feedback that
they have provided to us.
