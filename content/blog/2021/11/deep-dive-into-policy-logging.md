---
title: Deep Dive into policy logging
authors:
    - Rafael Fernández López
date: 2021-11-15
---

Policies are regular programs. As such they have the need to log often times. In general, we are
used to make our programs log into standard output (stdout) and standard error (stderr) outputs.

However, policies run in a confined WebAssembly environment. For this mechanism to work as usual
Kubewarden would need to set up the runtime environment in a way that stdout and stderr file
descriptors are set up so that the policy can write to them, and upon completion, Kubewarden can
check them -- or stream them as they pop up.

Although the previous approach was our very first initial implementation in Kubewarden, it's no
longer implemented that way.

Given we are providing SDK's for supported languages we can do a bit better. As we have described in
previous posts and in our documentation, Kubewarden uses waPC for allowing intercommunication
between the guest (the policy) and the host (Kubewarden -- the `policy-server` or `kwctl` if we are
running policies manually).

Kubewarden has defined  a contract between policies (guests) and the host (Kubewarden) for
performing [policy settings
validation](https://docs.kubewarden.io/writing-policies/spec/02-settings.html), [policy
validation](https://docs.kubewarden.io/writing-policies/spec/03-validating-policies.html), [policy
mutation](https://docs.kubewarden.io/writing-policies/spec/04-mutating-policies.html) and logging.

The waPC interface used for logging is a therefore a contract, because once you have built a policy,
it should be possible to run it in future Kubewarden versions. In this sense, Kubewarden keeps this
contract behind the SDK of your preferred language, so you don't have to deal with the details of
how logging is implemented in Kubewarden. You just have to use your logging library of choice for
the language you are working with.

Let's look into how to take advantage of logging with Kubewarden in specific languages!

## Policy Authors

### Go

We are going to use the [Go policy template](https://github.com/kubewarden/go-policy-template) as a
starting point.

Our Go SDK provides integration with the [`onelog`](https://github.com/francoispqt/onelog) library.
When our policy is built for the WebAssembly target, it will send the logs to the host through waPC.
Otherwise, it will just print them on stderr -- but this is only relevant if you happen to run your
policy outside a Kubewarden runtime environment.

One of the first things our policy does on its
[`main.go`](https://github.com/kubewarden/go-policy-template/blob/a8dd2b374ce32ab01838d0c3a04efda1735599b3/main.go)
file is to initialize the logger:

```go
var (
	logWriter = kubewarden.KubewardenLogWriter{}
	logger    = onelog.New(
		&logWriter,
		onelog.ALL, // shortcut for onelog.DEBUG|onelog.INFO|onelog.WARN|onelog.ERROR|onelog.FATAL
	)
)
```

We are then able to use `onelog` API in order to produce log messages. We could, for example,
perform structured logging with debugging level:

```go
logger.DebugWithFields("validating object", func(e onelog.Entry) {
    e.String("name", gjson.GetBytes(payload, "request.object.metadata.name").String())
	e.String("namespace", gjson.GetBytes(payload, "request.object.metadata.namespace").String())
})
```

Or, with info level:

```go
logger.InfoWithFields("validating object", func(e onelog.Entry) {
    e.String("name", gjson.GetBytes(payload, "request.object.metadata.name").String())
	e.String("namespace", gjson.GetBytes(payload, "request.object.metadata.namespace").String())
})
```

What happens under the covers is that our Go SDK sends [every log event to the `kubewarden` host
through
waPC](https://github.com/kubewarden/policy-sdk-go/blob/95c4b93adf6830862b85f953bc09d31de7490872/log_writer_wasi.go#L15).

### Rust

Let's use the [Rust policy template](https://github.com/kubewarden/policy-rust-template) as our
guide.

Our Rust SDK implements an integration with the `slog` crate. This crate exposes the concept of
drains, so we have to [define a global drain that we will use throughout our policy
code](https://github.com/kubewarden/policy-rust-template/blob/fd46e75b3794dbacbf499da6632d5294bdcea28c/src/lib.rs#L16-L21):

```rust
use kubewarden::logging;
use slog::{o, Logger};
lazy_static! {
    static ref LOG_DRAIN: Logger = Logger::root(
        logging::KubewardenDrain::new(),
        o!("some-key" => "some-value") // This key value will be shared by all logging events that use
                                       // this logger
    );
}
```

Then, we can use the macros provided by `slog` to log on different levels:

```rust
use slog::{crit, debug, error, info, trace, warn};
```

Let's log an info level message:

```rust
info!(
    LOG_DRAIN,
    "rejecting resource";
    "resource_name" => &resource_name
);
```

As happens with the Go SDK implementation, our Rust implementation of the `slog` drain sends [this
logging events to the host by using
waPC](https://github.com/kubewarden/policy-sdk-rust/blob/642d13b07053be6455c0b5f49df0e87ff6f022c5/src/logging/drain.rs#L57-L60).

You can read more about slog [here](https://github.com/slog-rs/slog).

### Swift

We will be looking at the [Swift policy
template](https://github.com/kubewarden/swift-policy-template) for this example.

As happens with Go and Rust's SDK's, the Swift SDK is instrumented to use Swift's `LogHandler`, so
our policy only has to initialize it. In our `Sources/Policy/main.swift` file:

```swift
import kubewardenSdk
import Logging

LoggingSystem.bootstrap(PolicyLogHandler.init)
```

Then, in our policy business logic, under `Sources/BusinessLogic/validate.swift`, we are able to log
with [different levels](https://apple.github.io/swift-log/docs/current/Logging/Structs/Logger.html):

```swift
import Logging

public func validate(payload: String) -> String {
    // ...

    logger.info("validating object",
        metadata: [
            "some-key": "some-value",
        ])

    // ...
}
```

Following the same strategy as the Go and Rust SDK's, the Swift SDK is able to [push log events to
the host through
waPC](https://github.com/kubewarden/policy-sdk-swift/blob/59cc979fa9994f1653d3d3e3dd3072188b2c0a18/Sources/kubewardenSdk/logger.swift#L75-L80).

## Cluster Administrators

Being able to log from within a policy is half of the story. Then, we have to be able to read and
potentially collect these logs.

As we have seen, Kubewarden policies support structured logging that is then forwarded to the
component running the policy. Usually, this is `kwctl` if you are executing the policy in a manual
fashion, or the `policy-server` if the policy is being ran in a Kubernetes environment.

Both `kwctl` and the  `policy-server` use the `tracing` crate to produce log events, either the
events that are produced by the application itself, or by policies that are running in WebAssembly
runtime environments.

### `kwctl`

The `kwctl` CLI tool takes a very straightforward approach to logging from policies: it will print
them to the standard error file descriptor.

### `policy-server`

The `policy-server` supports [different log
formats](https://github.com/kubewarden/policy-server/blob/d615bfe7fdf1fe6001e655360fe85f0db2194410/src/cli.rs#L174-L206):
`json`, `text` and `otlp`.

`otlp`? I hear you ask. It stands for OpenTelemetry Protocol. We will look into that in a bit.

If the `policy-server` is run with the `--log-fmt` argument set to `json` or `text`, the output will
be printed to the standard error file descriptor in JSON or plain text formats.

If `--log-fmt` is set to `otlp`, the `policy-server` will use OpenTelemetry to report logs and
traces.

## OpenTelemetry

Kubewarden is instrumented with OpenTelemetry, so it's possible for the `policy-server` to send
trace events to an [OpenTelemetry collector](https://opentelemetry.io/docs/collector/) by using the
OpenTelemtry Protocol (`otlp`).

Our official [Kubewarden Helm
Chart](https://github.com/kubewarden/helm-charts/blob/199b18b74ca664ab9370ba5fc101f890a3f3d00f/charts/kubewarden-controller/values.yaml)
has certain values that allow you to deploy Kubewarden with OpenTelemetry support, reporting logs
and traces to, for example, a Jaeger instance:

```yaml
telemetry:
  enabled: True
  tracing:
    jaeger:
      endpoint: "all-in-one-collector.jaeger.svc.cluster.local:14250"
```

This functionality closes the gap on logging/tracing, given the freedom that the OpenTelemetry
collector provides to us in terms of flexibility of what to do with this logs and traces.

But this is a big enough topic on its own worth a future blog post. Stay logged!