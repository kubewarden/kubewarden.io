---
title: "PHP2Shell: what happens after an attacker gains access"
authors:
  - Dan Čermák
date: 2026-11-24
components:
  - Runtime Enforcer
types:
  - tutorial
---

PHP2Shell refers to two critical vulnerabilities disclosed in October 2026 that
allow remote code execution in the PHP interpreter:

- [CVE-2026-109618](https://nvd.nist.gov/vuln/detail/cve-2026-109618):
  vulnerability in the way PHP uses `longjmp()` for out of memory scenarios to
  exit the current context. The code does not handle every situation correctly
  and can leave memory in uninitialized state, which the subsequent cleanup code
  could jump to or read from. This flaw can be used in out of memory scenarios
  to achieve remote code execution.
- [CVE-2026-109619](https://nvd.nist.gov/vuln/detail/cve-2026-109619): is a flaw
  in how PHP stores requests in global state. The global state is sometimes
  incorrectly reset and can point to freed request memory. Requests arriving after
  the incorrect cleanup can trigger branches depending on the freed memory or
  read from the incorrectly freed memory. This behavior can be exploited to
  execute code remotely.

PHP2Shell made it into major news outlets all over the world, caused temporary
shutdown of many webpages using PHP and was reported as being exploited in the
wild, e.g. by
[AWS](https://aws.amazon.com/blogs/security/amazon-threat-intelligence-identifies-php2shell-exploitation-prior-to-public-disclosure-in-madpot/).
Both vulnerabilities are exceptionally dangerous, as they exploit flaws in the
interpreter itself, i.e. before any PHP code is executed. This unfortunate
situation rendered many PHP deployments vulnerable and the only mitigation
(beyond patching) was to turn them off.

Kubewarden's Runtime Enforcer can limit the post-exploitation activity by
preventing the PHP interpreter from launching forbidden executables, such as a
shell or `curl`. But Runtime Enforcer does not fix the vulnerability itself nor
can it prevent code execution within the compromised PHP process.


## Setting up Runtime Enforcer

Follow the [Quick Start guide](https://docs.kubewarden.io/runtime-enforcer/latest/en/installation/quickstart.html)
to install Runtime Enforcer on your Kubernetes cluster.
First, install the prerequisite `cert-manager`:

```bash
helm repo add jetstack https://charts.jetstack.io

helm repo update

helm install cert-manager jetstack/cert-manager \
	--namespace cert-manager \
	--create-namespace \
	--set crds.enabled=true \
	--wait
```

Then install `cert-manager-csi-driver`:

```bash
helm install cert-manager-csi-driver jetstack/cert-manager-csi-driver \
	--namespace cert-manager \
	--wait
```

Once both components are installed, deploy Runtime Enforcer using Helm:

```bash
helm repo add kubewarden https://charts.kubewarden.io
helm repo update
helm install runtime-enforcer kubewarden/runtime-enforcer \
  --namespace runtime-enforcer \
  --create-namespace \
  --wait
```

Verify that the Runtime Enforcer Pods are running:

```ShellSession
❯ kubectl get pods -n runtime-enforcer
NAME                                                   READY   STATUS    RESTARTS   AGE
runtime-enforcer-agent-6rr98                           1/1     Running   0          43s
runtime-enforcer-agent-9wsvs                           1/1     Running   0          43s
runtime-enforcer-agent-frmss                           1/1     Running   0          43s
runtime-enforcer-agent-qdh8h                           1/1     Running   0          43s
runtime-enforcer-agent-tjg2v                           1/1     Running   0          43s
runtime-enforcer-controller-manager-76995d6d94-pl742   1/1     Running   0          43s
runtime-enforcer-otel-collector-7875ddd497-gg4t5       1/1     Running   0          43s
```

Expect one agent per node, a controller, and an OpenTelemetry collector.
If any component is missing or not running, consult the
[troubleshooting guide](https://docs.kubewarden.io/runtime-enforcer/latest/en/troubleshooting.html)
or ask in our [community channels](/#get-in-touch).

## Simulating remote code execution


We will not be creating a working exploit in this tutorial, as we only want to
focus on the post-exploitation case. Therefore, we replicate the remote code
execution with an intentionally vulnerable script. **DO NOT DEPLOY IT** in
production under any circumstances! Use an isolated cluster for testing.

First, we create a namespace for testing and deploy a PHP image using Apache as
the webserver:
```bash
kubectl create namespace php-demo
kubectl create deployment php-plain -n php-demo \
  --image=registry.suse.com/bci/php-apache:8 --port=80
kubectl wait -n php-demo --for=condition=Available deploy/php-plain --timeout=120s
```

To test the PHP-based web server, start a port forwarding and then send a
request to it:

```bash
# wait a second or two for the port forward to set up, or use a second terminal
kubectl port-forward -n php-demo deploy/php-plain 8080:80 &

curl http://localhost:8080/
```

The request returns HTTP status code 403 because Apache's document root contains
no `index.php`.

Verify that PHP is available in the container:

```ShellSession
❯ kubectl exec -n php-demo deploy/php-plain -- php -v

PHP 8.3.36 (cli) (built: Oct 20 2026 12:00:00) (NTS)
Copyright (c) The PHP Group
Zend Engine v4.3.36, Copyright (c) Zend Technologies
```

Runtime enforcer has been recording the behavior of the simple application in
the background. We can check the `WorkloadLoadPolicyProposal` using `kubectl`
omitting its metadata:

```ShellSession
❯ kubectl get workloadpolicyproposal deploy-php-plain -n php-demo -o jsonpath-as-json='{.spec}'
[
    {
        "rulesByContainer": {
            "php-apache": {
                "executables": {
                    "allowed": [
                        "/usr/local/bin/docker-php-entrypoint",
                        "/usr/local/bin/apache2-foreground",
                        "/usr/bin/sed",
                        "/usr/bin/readlink",
                        "/usr/bin/dirname",
                        "/usr/sbin/httpd-prefork",
                        "/usr/bin/mkdir",
                        "runc",
                        "/usr/bin/php"
                    ]
                }
            }
        }
    }
]
```

Before replacing the application with the vulnerable demo, clean the deployment
and the `WorkloadloadPolicyProposal` up:
```ShellSession
# stop the port forwarding or ctrl-c it if it's running in another terminal
kill %1
# remove the Deployment
kubectl delete deployment php-plain -n php-demo
# delete WorkloadloadPolicyProposal
kubectl delete workloadpolicyproposal deploy-php-plain -n php-demo --ignore-not-found
```

Deploy the vulnerable demo:

```bash
kubectl apply -n php-demo -f - <<'EOF'
apiVersion: v1
kind: ConfigMap
metadata:
  name: php2shell-demo-src
data:
  index.php: |
    <?php
    // !! VULNERABLE DEMO PAGE !!
    // !! DO NOT PUT IT IN PRODUCTION !!
    // You have been warned
    header('Content-Type: text/plain');
    echo "pid=" . getmypid() . " script_owner=" . get_current_user() . "\n\n";
    switch ($_REQUEST['action'] ?? '') {
      case 'shell':
        $out = shell_exec(($_REQUEST['cmd'] ?? 'id') . ' 2>&1');
        echo $out ?? "(no output: exec refused)\n";
        break;
      case 'php':
        eval($_REQUEST['code'] ?? 'echo "hello from inside php\n";');
        break;
      default:
        echo "usage: ?action=shell&cmd=...  or  ?action=php&code=...\n";
    }
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: php2shell-demo
  labels: { app: php2shell-demo }
spec:
  replicas: 1
  selector:
    matchLabels: { app: php2shell-demo }
  template:
    metadata:
      labels: { app: php2shell-demo }
    spec:
      containers:
        - name: php-apache
          image: registry.suse.com/bci/php-apache:8
          ports: [{ containerPort: 80 }]
          volumeMounts:
            - { name: src, mountPath: /srv/www/htdocs/index.php, subPath: index.php, readOnly: true }
      volumes:
        - name: src
          configMap: { name: php2shell-demo-src }
EOF
kubectl wait -n php-demo --for=condition=Available \
    deploy/php2shell-demo \
    --timeout=120s
```

The PHP script executes a shell command, evaluates PHP code, or prints usage
instructions, depending on the URL query. Every response includes the process ID
(PID) and the script owner's name. This allows us to demonstrate the fallout
from PHP2Shell.

## Recording a policy

Runtime Enforcer already records the `php2shell-demo` Deployment's activity. To
generate representative HTTP traffic, start a port forwarding and then send
requests via `curl`:

```bash
# wait a second or launch it in a different terminal
kubectl port-forward -n php-demo deploy/php2shell-demo 8080:80 &

# actual traffic
curl http://localhost:8080/?page=1
curl http://localhost:8080/?foo=bar
curl http://localhost:8080/i-dont-exist

# print usage instructions, the PID, and the script owner's name
curl http://localhost:8080/
```

Inspect the recorded `WorkloadPolicyProposal`:

```ShellSession
❯ kubectl get workloadpolicyproposal deploy-php2shell-demo -n php-demo -o jsonpath-as-json='{.spec}'
[
    {
        "rulesByContainer": {
            "php-apache": {
                "executables": {
                    "allowed": [
                        "/usr/local/bin/docker-php-entrypoint",
                        "/usr/local/bin/apache2-foreground",
                        "/usr/bin/sed",
                        "/usr/bin/readlink",
                        "/usr/bin/dirname",
                        "/usr/sbin/httpd-prefork",
                        "/usr/bin/mkdir"
                    ]
                }
            }
        }
    }
]
```

Promote the `WorkloadPolicyProposal` to a `WorkloadPolicy` in `monitor` mode
using either the [`kubectl runtime-enforcer`
plugin](https://docs.kubewarden.io/runtime-enforcer/latest/en/kubectl_plugin.html)
or with plain `kubectl`:

```bash
# with the plugin
kubectl runtime-enforcer proposal promote deploy-php2shell-demo \
    -n php-demo --mode monitor
# or without the plugin:
kubectl label workloadpolicyproposal deploy-php2shell-demo \
    -n php-demo runtimeenforcer.kubewarden.io/promote=monitor
```

Inspect the resulting `WorkloadPolicy`:

```ShellSession
❯ kubectl get workloadpolicy deploy-php2shell-demo -n php-demo -o yaml
apiVersion: runtimeenforcer.kubewarden.io/v1alpha1
kind: WorkloadPolicy
metadata:
  creationTimestamp: "2026-11-24T12:26:29Z"
  generation: 1
  labels:
    runtimeenforcer.kubewarden.io/promoted-from: deploy-php2shell-demo
  name: deploy-php2shell-demo
  namespace: php-demo
  resourceVersion: "225453"
  uid: e5d638d9-589e-4b84-a47e-7eb37b694b41
spec:
  mode: monitor
  rulesByContainer:
    php-apache:
      executables:
        allowed:
        - /usr/local/bin/docker-php-entrypoint
        - /usr/local/bin/apache2-foreground
        - /usr/bin/sed
        - /usr/bin/readlink
        - /usr/bin/dirname
        - /usr/sbin/httpd-prefork
        - /usr/bin/mkdir
```

## Connecting a policy to a workload

The policy exists but does not apply to the workload until the workload's Pods
reference it. The policy is bound to a Pod via the
`runtimeenforcer.kubewarden.io/policy` label. Add the policy label to the
Deployment template:

```bash
kubectl patch deployment php2shell-demo -n php-demo --type=merge \
  -p '{"spec":{"template":{"metadata":{"labels":{"runtimeenforcer.kubewarden.io/policy":"deploy-php2shell-demo"}}}}}'
kubectl rollout status deploy/php2shell-demo -n php-demo
```

The label change causes a rollout, which replaces the Pod and terminates the
existing port-forwarding. Restart the port forwarding after the rollout
completed via `kubectl port-forward -n php-demo deploy/php2shell-demo 8080:80 &`.

Inspect the `WorkloadPolicy` status. The following example shows the new
`status` entry with no recorded violations:

```ShellSession
❯ kubectl get workloadpolicy deploy-php2shell-demo -n php-demo -o yaml
apiVersion: runtimeenforcer.kubewarden.io/v1alpha1
kind: WorkloadPolicy
metadata:
  creationTimestamp: "2026-11-24T12:26:29Z"
  generation: 1
  labels:
    runtimeenforcer.kubewarden.io/promoted-from: deploy-php2shell-demo
  name: deploy-php2shell-demo
  namespace: php-demo
  resourceVersion: "270688"
  uid: e5d638d9-589e-4b84-a47e-7eb37b694b41
spec:
  mode: monitor
  rulesByContainer:
    php-apache:
      executables:
        allowed:
        - /usr/local/bin/docker-php-entrypoint
        - /usr/local/bin/apache2-foreground
        - /usr/bin/sed
        - /usr/bin/readlink
        - /usr/bin/dirname
        - /usr/sbin/httpd-prefork
        - /usr/bin/mkdir
status:
  activeViolationCount: 0
  observedGeneration: 1
  phase: Ready
  successfulNodes: 3
  totalNodes: 3
  violationCount: 0
```

In `monitor` mode, Runtime Enforcer records violations without blocking
execution. Trigger a violation by executing `whoami`, which is not on the
allowlist:

```ShellSession
❯ curl "http://localhost:8080/?action=shell" --data-urlencode "cmd=whoami"
pid=23 script_owner=root

wwwrun
```

The violation is emitted as an OpenTelemetry event. Without a full OpenTelemetry
Stack, we check the collectors logs directly:

```ShellSession
❯ kubectl logs -n runtime-enforcer deployment/runtime-enforcer-otel-collector

# lots of output
policy_violation policy.name=deploy-php2shell-demo k8s.namespace.name=php-demo k8s.pod.name=php2shell-demo-6b7f77459c-h76vn container.name=php-apache proc.exepath=/usr/bin/bash node.name=k3s-node-b6d5bbd7d1bd4ed1a2a3197393db58a4 action=monitor
policy_violation policy.name=deploy-php2shell-demo k8s.namespace.name=php-demo k8s.pod.name=php2shell-demo-6b7f77459c-h76vn container.name=php-apache proc.exepath=/usr/bin/whoami node.name=k3s-node-b6d5bbd7d1bd4ed1a2a3197393db58a4 action=monitor

```

## Blocking executables using the policy

To block disallowed executables, switch the policy to `protect` mode using
either the [`kubectl runtime-enforcer`
plugin](https://docs.kubewarden.io/runtime-enforcer/latest/en/kubectl_plugin.html)
or with plain `kubectl`:

```bash
# with the runtime-enforcer plugin
kubectl runtime-enforcer policy protect deploy-php2shell-demo -n php-demo
# or with kubectl only:
kubectl patch workloadpolicy deploy-php2shell-demo -n php-demo --type=json \
    -p='[{"op":"replace","path":"/spec/mode","value":"protect"}]'
```

Verify that the policy reports mode `protect` and phase `Ready`:

```ShellSession
❯ kubectl get workloadpolicy deploy-php2shell-demo \
      -n php-demo \
      -o jsonpath='{"spec.mode: "}{.spec.mode}{"\nstatus.phase: "}{.status.phase}{"\n"}'
spec.mode: protect
status.phase: Ready
```

Repeat the request that simulates our remote code execution to call `whoami`:

```ShellSession
❯ curl "http://localhost:8080/?action=shell" --data-urlencode "cmd=whoami"
pid=26 script_owner=root

```

The HTTP request still succeeds, but in `protect` mode `whoami` produces no
output as the call was blocked by Runtime Enforcer. The OpenTelemetry collector
logs show that Runtime Enforcer blocked the shell execution:

```ShellSession
❯ kubectl logs -n runtime-enforcer deployment/runtime-enforcer-otel-collector

# lots of output
ScopeLog #0 violation-reporter
policy_violation policy.name=deploy-php2shell-demo k8s.namespace.name=php-demo k8s.pod.name=php2shell-demo-6b7f77459c-h76vn container.name=php-apache proc.exepath=/usr/bin/bash node.name=k3s-node-b6d5bbd7d1bd4ed1a2a3197393db58a4 action=protect
```

We have successfully blocked one potential exploit path!

## Policy limitations

Unfortunately, the executable policy cannot restrict operations within the
compromised PHP process. Code running in that process can still read and modify
files or access the network, subject to the process's permissions and other
security controls.

We can simulate reading sensitive data, by sending PHP code that reads the
contents of `/etc/passwd`:

```ShellSession
❯ curl "http://localhost:8080/?action=php" --data-urlencode 'code=echo file_get_contents("/etc/passwd");'
pid=22 script_owner=root

root:x:0:0:root:/root:/bin/bash
nobody:x:65534:65534:nobody:/var/lib/nobody:/bin/bash
wwwrun:x:499:485:WWW daemon apache:/var/lib/wwwrun:/usr/sbin/nologin
```

Runtime Enforcer cannot block this attack, because it only blocks individual
binaries. It is a part of your security strategy, but it cannot protect you from
all attack scenarios.


## Next steps

The `WorkloadPolicyProposal` from [Recording a policy](#recording-a-policy)
contains several executables used during container startup:

```json
[
    {
        "rulesByContainer": {
            "php-apache": {
                "executables": {
                    "allowed": [
                        "/usr/local/bin/docker-php-entrypoint",
                        "/usr/local/bin/apache2-foreground",
                        "/usr/bin/sed",
                        "/usr/bin/readlink",
                        "/usr/bin/dirname",
                        "/usr/sbin/httpd-prefork",
                        "/usr/bin/mkdir"
                    ]
                }
            }
        }
    }
]
```

These executable are included in the policy via the container image entry
point. An attacker with write access to any of these executables could replace it
without changing its path or triggering an execution policy violation.

A good next step would be to write a simpler container entrypoint, that omits a
majority of the current script. The current entrypoint is written for convenient
configuration during testing via environment variables. We can omit most of it
and instead ship a pre-configured image with a much simpler, but less flexible
entrypoint.
