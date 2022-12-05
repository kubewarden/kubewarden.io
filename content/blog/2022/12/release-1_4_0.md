---
title: Kubewarden 1.4.0 release
authors:
- Flavio Castelli
date: 2022-12-05
---

Today we're pleased to announce the availability of Kubewarden 1.4.0.

This version brings some minor fixes to our controller and helm charts and two
new interesting features.

## Sigstore certificate verification

Kubewarden integration with [Sigstore](https://sigstore.dev) keeps growing.
Starting from this release it's possible to verify signatures that have been
produced with certificates.

This can be useful to organizations that are using hardware tokens and KMS solutions
to sign their container images via Sigstore.

Take a look at [this](/blog/2022/12/sigstore-certificate-verification/) dedicated blog post to learn more
about this feature.

## Policy benchmarking

Staring from this release, [kwctl](https://github.com/kubewarden/kwctl/) gains
a new command called `bench`.

This command benchmarks the execution times of the
[`validate_settings`](https://docs.kubewarden.io/writing-policies/spec/settings#settings-validation)
and the
[`validate`](https://docs.kubewarden.io/writing-policies/spec/validating-policies)
functions.

By using this command, policy authors can better understand how their code
behaves once compiled to WebAssembly.

The `bench` command takes the same set of parameters as the `run` one and
provides a quick overview about the execution times of these two core functions:

```console
kwctl bench -r verify-image-signatures/test_data/pod_creation_signed_with_certificate.json \
            -s verify-image-signatures/test_data/settings-pod_signed_with_cert_and_rekor.yaml \
            verify-image-signatures/policy.wasm
validate_settings warming up for 3.00s
validate_settings mean warm up execution time 615.52µs running 10.1 thousand iterations
validate_settings [10.1 thousand iterations in 6.13s with 100.0 samples]:
	elapsed	[min mean max]:	[603.17µs 607.30µs 628.31µs] (sample data: med = 606.19µs, var = 12.73ms², stddev = 3.57µs)
validate warming up for 3.00s
validate mean warm up execution time 3.51s running 5.0 thousand iterations
validate [5.0 thousand iterations in 2.06s with 100.0 samples]:
	elapsed	[min mean max]:	[375.99µs 412.94µs 534.05µs] (sample data: med = 415.81µs, var = 623.37ms², stddev = 24.97µs)
```

Stay tuned for a dedicated blog post about this specific command of `kwctl`.

## Go grab it!

We are eager to know what do you think about Kubewarden and this release.

As usual, you can reach out to us over [our slack channel](https://kubernetes.slack.com/?redir=%2Fmessages%2Fkubewarden).
