---
title: "Scanning secrets in environment variables"
authors:
- Raul Cabello Martin
date: 2022-10-17
---

We are thrilled to announce you can now scan your environment variables for secrets with the new
[env-variable-secrets-scanner-policy](https://github.com/kubewarden/env-variable-secrets-scanner-policy)! This policy rejects a `Pod`
or [workload resources](https://kubernetes.io/docs/concepts/workloads/) such as `Deployments`, `ReplicaSets`, `DaemonSets`
, `ReplicationControllers`, `Jobs`, `CronJobs` etc. if a secret is found in the environment variable
within a container, init container, or ephemeral container.

This policy uses [rusty hog](https://github.com/newrelic/rusty-hog), an open source secret scanner from New Relic. The
policy looks for the following secrets being leaked: RSA private keys, SSH private keys and API tokens for different
services like Slack, Facebook tokens, AWS, Google, New Relic Keys, etc

This is a perfect example of the real power of `Kubewarden` and `WebAssembly`! We didn't have to write all the complex
code and regular expressions for scanning secrets. Instead, we used an existing open source library that already
does this job. We can do this because `Kubewarden` [policies](https://docs.kubewarden.io/writing-policies) are delivered 
as `WebAssembly` binaries.

Have an idea for a new `Kubewarden` policy? You don't need to write all the code from scratch! You can use 
your favourite libraries in any of the [supported programming languages](https://docs.kubewarden.io/writing-policies), as long 
as they can be compiled to `WebAssembly`.

## Let's see it in action!

For this example, a Kubernetes cluster with Kubewarden already installed is required. The installation process is
described in the [quick start guide](https://docs.kubewarden.io/quick-start).

Let's create a `ClusterAdmissionPolicy` that will scan all pods for secrets in their environment variables:

```
kubectl apply -f - <<EOF
apiVersion: policies.kubewarden.io/v1
kind: ClusterAdmissionPolicy
metadata:
  name: env-variable-secrets
spec:
  module: ghcr.io/kubewarden/policies/env-variable-secrets-scanner-policy:v0.1.0
  mutating: false
  rules:
  - apiGroups: [""]
    apiVersions: ["v1"]
    resources: ["pods", "deployments", "replicasets", "daemonsets", "replicationcontrollers", "jobs", "cronjobs"]
    operations:
    - CREATE
    - UPDATE
EOF
```

Verify we are not allowed to create a Pod with an RSA private key

```
kubectl apply -f - <<EOF                                                                  
apiVersion: v1     
kind: Pod
metadata:
  name: secret
spec:
  containers:
    - name: nginx
      image: nginx:latest
      env:
        - name: rsa
          value: "-----BEGIN RSA PRIVATE KEY-----\nMIICWwIBAAKBgHnGVTJSU+8m8JHzJ4j1/oJxc/FwZakIIhCpIzDL3sccOjyAKO37\nVCVwKCXz871Uo+LBWhFoMVnJCEoPgZVJFPa+Om3693gdachdQpGXuMp6fmU8KHG5\nMfRxoc0tcFhLshg7luhUqu37hAp82pIySp+CnwrOPeHcpHgTbwkk+dufAgMBAAEC\ngYBXdoM0rHsKlx5MxadMsNqHGDOdYwwxVt0YuFLFNnig6/5L/ATpwQ1UAnVjpQ8Y\nmlVHhXZKcFqZ0VE52F9LOP1rnWUfAu90ainLC62X/aKvC1HtOMY5zf8p+Xq4WTeG\nmP4KxJakEZmk8GNaWvwp/bn480jxi9AkCglJzkDKMUt0MQJBAPFMBBxD0D5Um07v\nnffYrU2gKpjcTIZJEEcvbHZV3TRXb4sI4WznOk3WqW/VUo9N83T4BAeKp7QY5P5M\ntVbznhcCQQCBMeS2C7ctfWI8xYXZyCtp2ecFaaQeO3zCIuCcCqv+AyMQwX6GnzNW\nnVvAeDAcLkjhEqg6QW5NehcfilJbj2u5AkEA5Mk5oH8f5OmdtHN36Tb14wM5QGSo\n3i5Kk+RAR9dT/LvmlAJgkzyOyJz/XHz8Ycn8S2yZjXkHV7i+7utWiVJGEwJAOhXN\nh0+DHs+lkD8aK80EP8X5SQSzBeim8b2ukFl39G9Cn7DvCuWetk1vR/yBXNouaAr0\nWaS7S9gdd0/AMWws+QJAGjYTz7Ab9tLGT7zCTSHPzwk8m+gm4wMfChN4yAyr1kac\nTLzJZaNLjNmAfUu5azZTJ2LG9HR0B7jUyQm4aJ68hA==\n-----END RSA PRIVATE KEY-----"
EOF
```

This will produce the following output:

```
Error from server: error when creating "STDIN": admission webhook "clusterwide-env-variable-secrets.kubewarden.admission" denied
the request: The following secrets were found in environment variables -> container: nginx, key: rsa, reason: RSA private key. 
```

Check it out and let us know if you have any questions! Stay tuned for more blogs on new Kubewarden policies!
