---
title: Multiplatform Kubewarden
authors:
    - Rafael Fernández López
date: 2022-02-02
---

The Kubewarden team is glad to announce that in the spirit of helping
Policy Authors and Cluster Administrators, the project is now
officially multiplatform.

The list of supported platforms as of now are:

- Policy Server, as a [container image](https://github.com/kubewarden/policy-server/pkgs/container/policy-server):
  - `linux/amd64` (with the `musl` libc)
  - `linux/arm64` (with the `musl` libc)

- kwctl, as a [standalone binary](https://github.com/kubewarden/kwctl/releases):
  - `darwin` (`x86_64`)
  - `linux` (`aarch64`, with the `musl` libc)
  - `linux` (`x86_64`, with the `musl` libc)
  - `windows` (`x86_64`, with `MSVC`)

We have prioritized the usage of the same dependencies and toolchain
on platforms where we were able to do so.

## Looking for platform convergence

Initially, we were using `glibc` and `openssl` as dependencies in our
project. However, these two libraries are somewhat special and
sometimes problematic to converge into other platforms.

Here is a short resume of the lessons learned, sometimes the hard way,
for both libraries.

### The libc

In the early stage of development, the Kubewarden team decided to use the [`musl libc`](https://musl.libc.org/) library.
This allowed us to avoid potential difficulties with `glibc` down the road (i.e., Cross-compilation time or making a full static binary).

The team also thinks that producing a final static binary for all platforms is in our users' own interests, especially for a CLI tool like `kwctl`, which interacts directly with our users' environment.

### The SSL stack

The second part of the puzzle is `openssl`. It's also a complex piece
of software.

As stated above, we are interested in cross compiling for multiple
operating systems such as Windows and macOS (Darwin).

Luckily for us, a new TLS implementation has popped up in the Rust
ecosystem: [rustls](https://github.com/rustls/rustls). Thanks to
`rustls`, it's now easier to produce a final binary of `kwctl` that
will work on all major platforms. And all of that is from the same source
code.

## Closing

These decisions might seem very technical or bring less
value as other features. But for the Kubewarden team, it's important
we provide a solution that is suitable for as many people as
possible.

And at the same time, we try to keep the project as convergent as
possible, by reducing the number of critical, high-complexity
dependencies we use in our code base.

> Note: [`kwctl` is not building
> yet](https://github.com/kubewarden/kwctl/issues/124) on Apple
> Silicon (macOS). We are following this closely and will release the
> new architecture as soon as it's possible.
>
> In the meantime, you'll have to fallback to `rosetta` in this
> environment, so you can use the `x86_64` version of `kwctl`.

Try [Kubewarden](https://docs.kubewarden.io/quick-start.html) in as
many places as you want! We are eagerly looking for your feedback!
