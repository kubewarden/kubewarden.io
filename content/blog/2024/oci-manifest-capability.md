---
title: Retrieving OCI Image Manifests
authors:
  - José Guilherme Vanz
date: 2024-03-25
---


Kubewarden's latest version 1.11.0 introduces a new feature enabling policies
to retrieve OCI image manifests. This function, supported in both Rust and Go
SDKs, enhances the policy enforcement capabilities within Kubernetes
environments.

The update provides an additional layer of security inspection for
containerized environments. Developers can now write policies using the updated
SDKs to access OCI image manifests of container images. This access facilitates
more detailed inspections and validations, aligning with security standards and
organizational protocols.

A possible use case for this new capability is to allow policies to inspect the
platform supported by the given container images. As well as inspecting annotations,
user, environment variables and other information available inside the image
manifests.

### Getting Started

To showcase this capability, let's image a policy which verifies container
images annotations. This policy can have a function to check if the container
image has the [SPDX license
annotation](https://github.com/opencontainers/image-spec/blob/main/annotations.md#pre-defined-annotation-keys).
Consider this Rust validation code:

```rust 
fn has_license_specified(image: &str) -> Result<bool> {
    let manifest = get_manifest(image)?;
    match manifest {
        OciManifestResponse::Image(image) => Ok(image.annotations().as_ref().map_or_else(
            || false,
            |a| a.contains_key("org.opencontainers.image.licenses"),
        )),
        OciManifestResponse::ImageIndex(index) => {
            // This is a simplification - we should also look into the
            // referenced images
            Ok(index.annotations().as_ref().map_or_else(
                || false,
                |a| a.contains_key("org.opencontainers.image.licenses"),
            ))
        }
    }
}
```

The Rust function `has_license_specified` checks whether a license is specified
in the manifest of a given container image. It achieves this by retrieving the
image's manifest and then examining its type, which can be either an image or
an image index, as defined in the Open Container Initiative (OCI)
specification. The function looks for a specific key
(`org.opencontainers.image.licenses`) in the annotations of the manifest to
determine if a license is present. It returns a boolean value indicating the
presence or absence of this license or an error if it cannot fetch the
manifest.

This code, with its new capabilities, enables policy authors to effectively
verify container images. Specifically, they can reject requests for images that
lack the required annotations. Policy authors can use external libraries to implement more
sophisticated checks, such as utilizing available
[Go](https://github.com/github/go-spdx) or
[Rust](https://crates.io/crates/spdx) libraries to parse [SPDX license
expressions](https://spdx.github.io/spdx-spec/v2.3/SPDX-license-expressions/).
This capability significantly enhances the thoroughness of license validations
in policies, ensuring a higher level of compliance and accuracy in managing
container images. For example, it would be possible to write a policy that
rejects all the container images that do not have a license specified, plus
the ones that are distributed under a non OSI approved license.

Keep in mind that registries may return either the [OCI Index
manifest](https://github.com/opencontainers/image-spec/blob/main/image-index.md)
or the [OCI image
manifest](https://github.com/opencontainers/image-spec/blob/main/manifest.md),
depending on the OCI URI sent. This variance is expected, and policies should
be equipped to handle it. Policy authors now have the tools to create more
comprehensive policies that inspect OCI images thoroughly before deployment in
a cluster.

## Conclusion

To learn more about this and other host capabilities, refer to the [official
documentation](https://docs.kubewarden.io/next/writing-policies/spec/host-capabilities/container-registry#oci-manifest).

We look forward to seeing how the community utilizes this new feature to
develop innovative solutions. Share your ideas with us on our [Slack
channel](https://kubernetes.slack.com/?redir=%2Fmessages%2Fkubewarden) or at
our [monthly community
meeting](https://teamup.com/ks2bj74dvw132mhjtj?view=a&showProfileAndInfo=0&showSidepanel=1&disableSidepanel=1&showMenu=1&showAgendaHeader=1&showAgendaDetails=0&showYearViewHeader=1).

Stay updated with further enhancements to Kubewarden for effective Kubernetes
security management. Happy coding!
