---
title: Migrate your PSPs to Kubewarden policies!
authors:
- José Guilherme Vanz
date: 2022-07-13
---

> Warning: the code snippets shown inside of this blog post have become
> outdated. For up-to-date information checkout
> [this](https://docs.kubewarden.io/tasksDir/psp-migration) section of the
> Kubewarden documentation.

As announced in past blog posts, Kubewarden has 100% coverage of the deprecated,
and soon to be removed, Kubernetes PSPs. If everything goes as expected the PSPs will
be removed in Kubernetes v1.25 due for release on 23rd August 2022.

The Kubewarden team has written a script that leverages the migration tool written
by [AppVia](https://github.com/appvia/psp-migration), to migrate PSP
automatically. The tool is capable of reading PSPs YAML and can generate the equivalent
policies in many different policy engines. Our simple script migrates
your PSPs to their equivalent Kubewarden policies.

The script is available in the [utils repository](https://github.com/kubewarden/utils/blob/main/scripts/psp-to-kubewarden)
in the Kubewarden GitHub organization. It will download the
migration tool in the working directory and run it over all your PSPs printing
the equivalent Kuberwarden policies' definitions in the standard output. Therefore,
users can redirect the content to a file or to `kubectl` directly.

The script will migrate the PSPs defined in `kubectl` default context.
The Kubewarden policies will be printed to stdout. Thus, the users can
apply it directly or save it for further inspection. Let's take a look at an example:

In a cluster with the PSP  blocking access to host namespaces, blocking privileged containers,  not allowing privilege escalation, dropping all containers capabilities, listing the allowed volume types, defining the allowed user and groups to be used, controlling the supplemental group applied to volumes and forcing containers to run in a read-only root filesystem:

```yaml
apiVersion: policy/v1beta1
kind: PodSecurityPolicy
metadata:
  name: restricted
spec:
  hostNetwork: false
  hostIPC: false
  hostPID: false
  hostPorts:
    - min: 80
      max: 8080
  privileged: false
  # Required to prevent escalations to root.
  allowPrivilegeEscalation: false
  requiredDropCapabilities:
    - ALL
  # Allow core volume types.
  volumes:
    - 'configMap'
    - 'emptyDir'
    - 'projected'
    - 'secret'
    - 'downwardAPI'
    # Assume that ephemeral CSI drivers & persistentVolumes set up by the cluster admin are safe to use.
    - 'csi'
    - 'persistentVolumeClaim'
    - 'ephemeral'
  runAsUser:
    # Require the container to run without root privileges.
    rule: 'MustRunAsNonRoot'
  seLinux:
    # This policy assumes the nodes are using AppArmor rather than SELinux.
    rule: 'RunAsAny'
  supplementalGroups:
    rule: 'MustRunAs'
    ranges:
      # Forbid adding the root group.
      - min: 1
        max: 65535
  fsGroup:
    rule: 'MustRunAs'
    ranges:
      # Forbid adding the root group.
      - min: 1
        max: 65535
  readOnlyRootFilesystem: true

```

The equivalent Kubewarden policies can be applied directly to a cluster with
Kubewarden installed using the following command:

```console
$ ./psp-to-kubewarden | kubectl apply -f -
Warning: policy/v1beta1 PodSecurityPolicy is deprecated in v1.21+, unavailable in v1.25+
Warning: policy/v1beta1 PodSecurityPolicy is deprecated in v1.21+, unavailable in v1.25+
clusteradmissionpolicy.policies.kubewarden.io/psp-privileged-82bf2 created
clusteradmissionpolicy.policies.kubewarden.io/psp-readonlyrootfilesystem-b4a55 created
clusteradmissionpolicy.policies.kubewarden.io/psp-hostnamespaces-a25a2 created
clusteradmissionpolicy.policies.kubewarden.io/psp-volumes-cee05 created
clusteradmissionpolicy.policies.kubewarden.io/psp-capabilities-34d8e created
clusteradmissionpolicy.policies.kubewarden.io/psp-usergroup-878b0 created
clusteradmissionpolicy.policies.kubewarden.io/psp-fsgroup-3b08e created
clusteradmissionpolicy.policies.kubewarden.io/psp-defaultallowprivilegeescalation-b7e87 created
```

If users want to inspect the policies before applying, it's possible to redirect
the content to a file or review it directly on the console.

```console
$ ./psp-to-kubewarden > policies.yaml
$ cat policies.yaml
---
apiVersion: policies.kubewarden.io/v1
kind: ClusterAdmissionPolicy
metadata:
  name: psp-privileged-82bf2
spec:
  module: registry://ghcr.io/kubewarden/policies/pod-privileged:v0.1.10
  rules:
    - apiGroups:
        - ""
      apiVersions:
        - v1
      resources:
        - pods
      operations:
        - CREATE
        - UPDATE
  mutating: false
  settings: null

---
apiVersion: policies.kubewarden.io/v1
kind: ClusterAdmissionPolicy
metadata:
  name: psp-readonlyrootfilesystem-b4a55
spec:
  module: registry://ghcr.io/kubewarden/policies/readonly-root-filesystem-psp:v0.1.3
  rules:
    - apiGroups:
        - ""
      apiVersions:
        - v1
      resources:
        - pods
      operations:
        - CREATE
        - UPDATE
  mutating: false
  settings: null

---
apiVersion: policies.kubewarden.io/v1
kind: ClusterAdmissionPolicy
metadata:
  name: psp-hostnamespaces-a25a2
spec:
  module: registry://ghcr.io/kubewarden/policies/host-namespaces-psp:v0.1.2
  rules:
    - apiGroups:
        - ""
      apiVersions:
        - v1
      resources:
        - pods
      operations:
        - CREATE
        - UPDATE
  mutating: false
  settings:
    allow_host_ipc: false
    allow_host_pid: false
    allow_host_ports:
      - max: 8080
        min: 80
    allow_host_network: false

---
apiVersion: policies.kubewarden.io/v1
kind: ClusterAdmissionPolicy
metadata:
  name: psp-volumes-cee05
spec:
  module: registry://ghcr.io/kubewarden/policies/volumes-psp:v0.1.6
  rules:
    - apiGroups:
        - ""
      apiVersions:
        - v1
      resources:
        - pods
      operations:
        - CREATE
        - UPDATE
  mutating: false
  settings:
    allowedTypes:
      - configMap
      - emptyDir
      - projected
      - secret
      - downwardAPI
      - csi
      - persistentVolumeClaim
      - ephemeral

---
apiVersion: policies.kubewarden.io/v1
kind: ClusterAdmissionPolicy
metadata:
  name: psp-capabilities-34d8e
spec:
  module: registry://ghcr.io/kubewarden/policies/capabilities-psp:v0.1.9
  rules:
    - apiGroups:
        - ""
      apiVersions:
        - v1
      resources:
        - pods
      operations:
        - CREATE
        - UPDATE
  mutating: false
  settings:
    allowed_capabilities: []
    required_drop_capabilities:
      - ALL

---
apiVersion: policies.kubewarden.io/v1
kind: ClusterAdmissionPolicy
metadata:
  name: psp-usergroup-878b0
spec:
  module: registry://ghcr.io/kubewarden/policies/user-group-psp:v0.2.0
  rules:
    - apiGroups:
        - ""
      apiVersions:
        - v1
      resources:
        - pods
      operations:
        - CREATE
        - UPDATE
  mutating: false
  settings:
    run_as_user:
      rule: MustRunAsNonRoot
    supplemental_groups:
      ranges:
        - max: 65535
          min: 1
      rule: MustRunAs

---
apiVersion: policies.kubewarden.io/v1
kind: ClusterAdmissionPolicy
metadata:
  name: psp-fsgroup-3b08e
spec:
  module: registry://ghcr.io/kubewarden/policies/allowed-fsgroups-psp:v0.1.4
  rules:
    - apiGroups:
        - ""
      apiVersions:
        - v1
      resources:
        - pods
      operations:
        - CREATE
        - UPDATE
  mutating: false
  settings:
    ranges:
      - max: 65535
        min: 1
    rule: MustRunAs

---
apiVersion: policies.kubewarden.io/v1
kind: ClusterAdmissionPolicy
metadata:
  name: psp-defaultallowprivilegeescalation-b7e87
spec:
  module: >-
    registry://ghcr.io/kubewarden/policies/allow-privilege-escalation-psp:v0.1.11
  rules:
    - apiGroups:
        - ""
      apiVersions:
        - v1
      resources:
        - pods
      operations:
        - CREATE
        - UPDATE
  mutating: false
  settings:
    default_allow_privilege_escalation: false

```

> **Note**: The policies names are generated by the PSP migration tool used. The
> operator may want to change the name to something more meaningful.

> **Warning:** This script works only in Linux x86_64 machines.

The Kubewarden team expects that this will help users migrate from PSPs as soon as possible.
Let us know if you run into issues. We are happy to help!


### References

[Kubewarden policies cover all the Kubernetes Pod Security Policies](https://www.kubewarden.io/blog/2022/01/mutating-policy-behave-as-validating/)

[Have you migrated your Kubernetes PodSecurityPolicy?](https://www.kubewarden.io/blog/2022/05/psp-migration-docs/)


