---
title: Securing the usage of volumeMounts
authors:
- Víctor Cuadrado Juan
date: 2022-10-19
---

We present to you the new
[volumeMounts Policy](https://artifacthub.io/packages/kubewarden/volumemounts-policy/volumemounts):
It inspects containers, init containers, and ephemeral containers, and restricts
their usage of volumes by checking the volume name being used in
the containers' `volumeMounts[*].name`.

You can find it [published in Artifact Hub](https://artifacthub.io/packages/kubewarden/volumemounts-policy/volumemounts).
As usual, its artifact is signed with Sigstore in keyless mode, and if you are
curious, you can peek into the policy's
[implementation in Rust here](https://github.com/kubewarden/volumemounts-policy).

This new policy joins the already existing
[volumes-psp policy](https://artifacthub.io/packages/kubewarden/volumes-psp/volumes-psp),
which provides an allowlist of volume types, and
[hostpaths-psp policy](https://artifacthub.io/packages/kubewarden/hostpaths-psp/hostpaths-psp),
with an allowlist of hostPath volumes.


### What is so useful about the new volumeMounts policy?

The existing PSP policies restricted usage of volumes, as a cluster admin. The
new volumeMounts policy has settings with 4 operators that enable you to check
for compliance and migration usecases, even if you don't have access to
controlling creation of Volumes in the cluster. Let's see them: 

- `reject: anyIn`: Works as a denylist of your usage of volumes.
  Since we are checking volume names, we can also filter
  [Out-Of-Tree volumes](https://kubernetes.io/docs/concepts/storage/volumes/#out-of-tree-volume-plugins):
    ```yaml
    reject: anyIn
    volumeMountsNames:
    - my-secure-hostpath-volume
    - my-cache-volume
    - my-out-of-tree-volume
    ```
- `reject: anyNotIn`: Works as an allowlist.
    ```yaml
    reject: anyNotIn
    volumeMountsNames:
    - my-secrets-volume
    - my-volume2
    ```
- `reject: allAreUsed`: The container cannot use all listed volumes at once.
  Helpful for enforcing migration between volumes, for example:
    ```yaml
    reject: allAreUsed
    volumeMountsNames:
    - old-deprecated-volume
    - new-supported-volume
    ```

- `reject: notAllAreUsed`: The container can use all listed volumes at once, but only one of them.
  Helpful for enforcing backup operations, for example:
    ```yaml
    reject: notAllAreUsed
    volumeMountsNames:
    - work-volume
    - backup-volume
    ```


### In action

Just instantiate an `AdmissionPolicy` or cluster-wide `ClusterAdmissionPolicy`
with the policy module and settings. Here's a definition of a policy that
rejects any workload resource (Pods, Deployments, Cronjobs..) that doesn't
adhere to the `volumeMounts` allowlist:

```yaml
kubectl apply -f - <<EOF
apiVersion: policies.kubewarden.io/v1
kind: ClusterAdmissionPolicy
metadata:
  name: volumemounts-policy
spec:
  module: ghcr.io/kubewarden/policies/volumemounts-policy:v0.1.0
  mutating: false
  rules:
  - apiGroups: [""]
    apiVersions: ["v1"]
    resources: ["pods", "deployments", "replicasets", "daemonsets", "replicationcontrollers", "jobs", "cronjobs"]
    operations:
    - CREATE
    - UPDATE
  settings:
    reject: anyNotIn # as an allowlist
    volumeMounts:
    - my-volume
    - my-volume2
EOF
```


Try it out!
As usual, we look forward to your feedback :). Have ideas for new policies?
Would you like more features on existing ones?
Drop us a line at [#kubewarden on Slack](https://kubernetes.slack.com/archives/C01T3GTC3L7)!
