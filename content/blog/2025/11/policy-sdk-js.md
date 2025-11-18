---
title: "Introducing the Kubewarden JavaScript/TypeScript SDK"
authors:
  - Esosa Ohangbon
date: 2025-11-16
---

Writing Kubewarden policies is now even more accessible. Today, we're excited to announce the alpha release of the [Kubewarden JavaScript/TypeScript SDK](https://github.com/kubewarden/policy-sdk-js), bringing policy development to the world's most popular programming language.

## Why JavaScript for Kubernetes Policies?

Kubewarden has always been about choice, letting you write policies in the language you're most comfortable with. The JavaScript/TypeScript SDK opens Kubewarden to an entirely new audience, the millions of developers already familiar with the JavaScript ecosystem. You no longer need to learn a new language just to write a Kubewarden policy.

## How It Works

Kubewarden uses [Javy](https://github.com/bytecodealliance/javy), a project from the Bytecode Alliance that compiles JavaScript to WebAssembly. This means your JavaScript policies run with the same security, portability, and performance characteristics as policies written in any other Kubewarden-supported language.

The compilation pipeline is straightforward:
1. Write your policy in JavaScript or TypeScript
2. Compile to WebAssembly using the SDK's tooling
3. Deploy to your cluster, just like any other Kubewarden policy

## What's Included

The SDK comes with everything you need to get started:

### Host Capabilities APIs

We've implemented comprehensive TypeScript APIs for Kubewarden's host capabilities, giving your policies access to:

- **Container Registry Operations**: Look up OCI manifest digests, retrieve manifests, and fetch image configurations
- **Network Capabilities**: Perform DNS lookups and hostname resolution
- **Kubernetes Resource Access**: Query cluster resources, list across namespaces, and verify permissions
- **Cryptographic Operations**: Verify certificates and perform cryptographic validations
- **Sigstore Integration**: Verify signatures using public keys, keyless verification, GitHub Actions provenance, and more

All APIs are fully typed, giving you IntelliSense and type safety throughout your policy development.

### Policy Template

To get started, clone our [policy template repository](https://github.com/kubewarden/js-policy-template/). The template includes:

- Pre-configured TypeScript compilation pipeline
- Integration with the Kubewarden SDK
- End-to-end testing framework using bats
- Example policy demonstrating best practices
- Integration with Kubernetes TypeScript types for complete type safety

For a step-by-step guide on using the template, check out our [comprehensive tutorial](https://docs.kubewarden.io/tutorials/writing-policies/typescript/intro-typescript).

Here's what a simple policy looks like:
```typescript
import { Validation, writeOutput } from 'kubewarden-policy-sdk';

export function validate(): void {
  try {
    const validationRequest = Validation.Validation.readValidationRequest();
    const settings: PolicySettings = validationRequest.settings || {};
    const resource = getKubernetesResource(validationRequest);
    if (!resource) {
      writeOutput(Validation.Validation.rejectRequest('Failed to parse Kubernetes resource.'));
      return;
    }
    if (resource.kind !== 'Pod') {
      writeOutput(Validation.Validation.acceptRequest());
      return;
    }

    const hostname = getPodHostname(resource as Pod);
    const deniedHostnames = settings.denied_hostnames || [];
    if (!hostname) {
      writeOutput(Validation.Validation.acceptRequest());
      return;
    }

    if (deniedHostnames.includes(hostname)) {
      writeOutput(
        Validation.Validation.rejectRequest(
          `Pod hostname '${hostname}' is not allowed. Denied hostnames: [${deniedHostnames.join(', ')}]`
        ),
      );
    } else {
      writeOutput(Validation.Validation.acceptRequest());
    }
  } catch (err) {
    console.error('Validation error:', err);
    writeOutput(Validation.Validation.rejectRequest(`Validation failed: ${err}`));
  }
}
```

### Demo Policy

To see the full power of the SDK take a look at the [comprehensive demonstration policy](https://github.com/kubewarden/policy-sdk-js/tree/main/demo_policy) that showcases all 14 host capability operations. It serves as both a learning resource and a testing suite, demonstrating real-world usage patterns for container registry access, network operations, Kubernetes resource queries, and signature verification.

## Get Started Today

The SDK is available now on npm and [GitHub](https://github.com/kubewarden/policy-sdk-js):
```bash
npm install kubewarden-policy-sdk
```

The current release is [kubewarden-policy-sdk@0.1.2](https://www.npmjs.com/package/kubewarden-policy-sdk).

To scaffold your first policy:
```bash
git clone https://github.com/kubewarden/js-policy-template.git my-policy
cd my-policy
npm install
# Start writing your policy in src/index.ts
```

We've also created a comprehensive [tutorial](https://docs.kubewarden.io/tutorials/writing-policies/typescript/intro-typescript) that walks you through building a policy using the template.

## A Note on GSoC

This project came to life through my work in Google Summer of Code 2025, bringing JavaScript/TypeScript support to Kubewarden. Huge thanks to the CNCF, my mentors Flavio, Victor, and José, and the Kubewarden community for making this possible.

## Getting in touch

We'd love to hear what you build with the JavaScript SDK! Whether you're writing your first admission policy or porting existing logic into Kubewarden, we're here to help.

Join us on [Slack](https://kubernetes.slack.com/?redir=%2Fmessages%2Fkubewarden) or [GitHub discussions](https://github.com/orgs/kubewarden/discussions) to share your experience, ask questions, or contribute to the SDK's development.
