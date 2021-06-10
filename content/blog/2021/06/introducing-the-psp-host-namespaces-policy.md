---
title: Introducing the PSP host namespaces policy
authors:
    - Rafael Fernández López
date: 2021-06-11
---

As you probably know, Kubernetes Pod Security Policies (PSPs) [are being
deprecated in Kubernetes
1.21](https://github.com/kubernetes/kubernetes/blob/a3abd06ad53b2f02dcb6e060c7606ceda41f44af/CHANGELOG/CHANGELOG-1.21.md#deprecation-of-podsecuritypolicy)
-- although these APIs will be served until Kubernetes 1.25 it's a
good time to start thinking about what you will use to replace them.

At Kubewarden we have an ongoing effort to replace the Pod Security
Policies with small, targeted Kubewarden policies.

Up until now, we have implemented some policies that replace some Pod
Security Policies:

- [`psp-capabilities`](https://github.com/kubewarden/psp-capabilities):
  validating and mutating policy that allows you to control the usage
  of container capabilities, for example allowing you to ensure that a
  container has the required capabilities it needs to work correctly,
  or that it drops capabilities it doesn't need, reducing the attack
  surface of your containers.
- [`psp-allow-privilege-escalation`](https://github.com/kubewarden/psp-allow-privilege-escalation):
  validating policy that allows you to ensure that no containers in a
  given pod can set `.securityContext.allowPrivilegeEscalation: true`
  in the security context of the container.
- [`psp-apparmor`](https://github.com/kubewarden/psp-apparmor):
  validating policy that allows you to specify a list of allowed
  AppArmor profiles that a `Pod` can use.

And now, the
[`psp-host-namespaces`](https://github.com/kubewarden/psp-host-namespaces)
policy joins this list. Let's inspect it a bit further.

## The policy

This policy is able to control whether a `Pod` can request certain
host namespaces, instead of using a dedicated namespace for that pod
-- as is the regular case.

While using the host namespaces is something to be avoided, there are
situations in which a workload needs to access them. For example, a
workload that inspects the processes running on the host.

### Policy settings

The policy allows the following settings:

* `allow_host_ipc`: allows the pod to set `.spec.HostIPC` to true.
* `allow_host_network`: allows the pod to set `.spec.HostNetwork` to true.
* `allow_host_pid`: allows the pod to set `.spec.HostPID` to true.
* `allow_host_ports`: is a list of port ranges of the form:

  ```yaml
  allow_host_ports:
    - min: 80
      max: 80
    - min: 443
      max: 443
    - min: 8000
      max: 9000
  ```

  This example would allow host ports `80`, `443` and the range
  `8000-9000` in the Pod `.spec.containers[].ports[].hostPort` attributes.

By default all settings are disallowed, so if you want to allow the
usage of, say, the host network and the host PID namespace usage, the
policy would need to have the following settings:

```yaml
allow_host_network: true
allow_host_pid: true
```

### Running the policy

The policy validates Pods at creation time.

Let's run a couple of tests with [our CLI tool,
`kwctl`](https://github.com/kubewarden/kwctl/).

You will need at least `kwctl` version 0.1.7 to execute this examples.

Let's start by evaluating a Pod creation request which has host PID
enabled:

```console
$ curl https://raw.githubusercontent.com/kubewarden/psp-host-namespaces/v0.0.7/test_data/pod_host_pid_enabled.json 2> /dev/null | \
    kwctl run -r - registry://ghcr.io/kubewarden/policies/psp-host-namespaces:v0.0.7 | jq
{
  "uid": "1299d386-525b-4032-98ae-1949f69f9cfc",
  "allowed": false,
  "status": {
    "message": "Pod has host PID enabled, but this is not allowed"
  }
}
```

As you can see, the request is rejected and a proper explanation is
returned to the user.

In the previous run no settings were provided to the policy, so the
default settings defined by the policy were used. Settings can also be
provided as an empty string or an empty object. It's always up to the
policy to do settings defaulting, if any.

```console
$ curl https://raw.githubusercontent.com/kubewarden/psp-host-namespaces/v0.0.7/test_data/pod_host_pid_enabled.json 2> /dev/null | \
    kwctl run --settings-json '{}' -r - registry://ghcr.io/kubewarden/policies/psp-host-namespaces:v0.0.7 | jq
{
  "uid": "1299d386-525b-4032-98ae-1949f69f9cfc",
  "allowed": false,
  "status": {
    "message": "Pod has host PID enabled, but this is not allowed"
  }
}
```

The pod was rejected again, as this execution is equivalent to the
previous one, as their settings are defaulted by the policy to the
same ones.

Now, let's enable the PID namespace host in the policy settings:

```console
$ curl https://raw.githubusercontent.com/kubewarden/psp-host-namespaces/v0.0.7/test_data/pod_host_pid_enabled.json 2> /dev/null | \
    kwctl run --settings-json '{ "allow_host_pid": true }' -r - registry://ghcr.io/kubewarden/policies/psp-host-namespaces:v0.0.7 | jq
{
  "uid": "1299d386-525b-4032-98ae-1949f69f9cfc",
  "allowed": true
}
```

And that works as expected!

## Conclusion

Stay tuned, because during the following weeks we will implement the
[rest of the Pod Security Policies in separate, small Kubewarden
policies](https://github.com/kubewarden/policy-hub/issues/32).

You can use [this GitHub
search](https://github.com/kubewarden/?q=psp&type=&language=&sort=) to
find out what Kubewarden policies are implementing Pod Security
Policies.

You can also discover more policies in the [Policy
Hub](https://hub.kubewarden.io/).

You can read more about [how to run this policies in a Kubernetes
cluster by reading our documentation](https://docs.kubewarden.io/).

As always, thank you for reading!
