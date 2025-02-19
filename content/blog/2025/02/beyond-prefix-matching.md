---
title: Beyond Prefix Matching
authors:
  - Flavio Castelli
  - Nuno do Carmo
  - Víctor Cuadrado Juan
date: 2025-02-19
---

A recent [Aqua Security blog](https://www.aquasec.com/blog/risks-misconfigured-kubernetes-policy-engines-opa-gatekeeper/) post highlighted
the risks of misconfigured Kubernetes policy engines, particularly when dealing with OPA Gatekeeper.
The post correctly points out the challenges of managing complex policies and the potential for bypasses due to misconfigurations.
However, it also underscores a critical limitation of many policy engines: their reliance on string manipulation, especially when dealing with OCI image references.
This is where Kubewarden takes a different, and significantly more robust, approach.

## The Challenge: Accurately Handling OCI Image References

The Aqua blog mentions common misconfigurations, many of which stem from the difficulty of accurately matching image names. Prefix matching and regular expressions are often used,
but as the blog hints, these methods fall short when handling the intricacies of the OCI (Open Container Initiative) specification. The OCI registry naming scheme is complex,
with numerous edge cases that are difficult, if not impossible, to capture reliably with simple string operations.
Trying to approximate the OCI spec with regular expressions is a recipe for potential vulnerabilities.

## Kubewarden's Solution: Real Code for Real Problems

This is where Kubewarden shines. Unlike other policy engines that rely on string manipulation, Kubewarden executes real code.
Specifically, Kubewarden leverages a Rust library that performs OCI reference parsing according to the official specification.
This crucial difference eliminates the guesswork and inherent inaccuracies of string-based approaches.
Instead of trying to approximate the OCI spec with regular expressions, Kubewarden uses the spec itself to ensure accurate and reliable image name validation.

## A Practical Example: The trusted-repos Policy

Consider a real-world example: the [trusted-repos](https://github.com/kubewarden/trusted-repos-policy) policy within the Kubewarden project.
This policy doesn't rely on prefix matching. Instead, it checks against a provided set of trusted repositories.

The code, available on GitHub [here](https://github.com/kubewarden/trusted-repos-policy/blob/main/src/validation.rs#L99-L104),
demonstrates how the .registry component of the image reference is extracted and validated. This extraction is performed using the aforementioned Rust library,
ensuring adherence to the OCI spec and avoiding the pitfalls of string-based approximations.

## The Kubewarden Advantage: Accuracy, Reliability, and Maintainability

Kubewarden's approach offers several key advantages:

- **Unmatched Accuracy:** By using a dedicated OCI library, Kubewarden ensures accurate parsing and validation of image references, eliminating the risk of
  bypasses due to misconfigured regular expressions or incorrect prefix matching.
- **Superior Reliability:** Because Kubewarden uses the official OCI spec, it's far more reliable than solutions that attempt to recreate the spec with string manipulation.
  This translates to more secure and predictable policy enforcement.
- **Improved Maintainability:** Instead of wrestling with complex regular expressions, Kubewarden policies can be written with clear, concise code that leverages the OCI library.
  This makes policies easier to understand, maintain, and debug.
- **Conclusion:** Embrace Real Code for Kubernetes Security

In short, while other policy engines struggle with the complexities of OCI image naming, Kubewarden offers a clean, robust, and accurate solution.
By executing real code and adhering to the official OCI specification, Kubewarden provides a level of security and reliability that string-based approaches simply can't match.
If you're serious about Kubernetes security, it's time to move beyond prefix matching and embrace the power of real code with Kubewarden.
