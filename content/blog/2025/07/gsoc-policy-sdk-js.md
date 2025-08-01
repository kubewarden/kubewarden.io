---
title: Writing Kubewarden Policies in TypeScript/JavaScript (Google Summer of Code)
authors:
- Esosa Ohangbon
date: 2025-07-29
---

Hi, I’m Esosa Ohangbon, a software engineering student at Carleton University. This summer, I've had the incredible opportunity to participate in **Google Summer of Code (GSoC)** as a contributor to **Kubewarden**.

My focus has been on developing [`policy-sdk-js`](https://github.com/kubewarden/policy-sdk-js), a JavaScript SDK for writing Kubewarden policies using JavaScript or TypeScript. In this post, I’ll share what the experience has been like so far, some of the challenges I’ve faced, what I’ve learned, and what I’m looking forward to next.

## The Project

Kubernetes policies are crucial for maintaining security, compliance, and operational best practices within clusters. Kubewarden simplifies this by allowing policies to be written in languages the compile to WebAssembly modules. While Kubewarden already supports languages like Rust, Go, and Rego, there hasn't been any official support for JavaScript.

The goal of the project is to enable developers to write Kubewarden policies in JavaScript/TypeScript using [Javy](https://github.com/bytecodealliance/javy), a project from the [Bytecode Alliance](https://bytecodealliance.org/) organization, for compilation to WebAssembly. This opens up Kubewarden to a whole new group of developers who may not be comfortable with Rust or Go but are very familiar with JavaScript or TypeScript.

## The Work So Far

My work on the project began with a community bonding period, where I familiarized myself with how Kubewarden policies work, existing SDKs, and the Javy compiler.

Most of my subsequent work has been focused on implementing the APIs for Kubewarden's host capabilities.

| Capability   | Status      |
|------------------------|-------------|
| Network                | Implemented |
| Container Registry     | Implemented |
| Kubernetes             | In Progress |
| Cryptographic          | Upcoming |
| Signature Verification | Upcoming    |


Another area of focus has been establishing testing and validation. I've worked with my mentors to add a reliable testing infrastructure using `kwctl` and `Bats`. This setup allows us to test each implemented host capability through a dedicated `test_policy` within the SDK. This has been critical for catching issues early.

## Mentorship and Community

Throughout this process, I've had the privilege of regular meeting with my mentors, Victor Cuadrado Juan, José Guilherme Vanz, and Flavio Castelli. These weekly syncs have been important for discussing progress, addressing blockers, and refining the project's direction. Beyond the formal meetings, the Kubewarden community's presence on GitHub and Slack has been incredibly supportive.

## What I've learned

So far, GSoC has been a massive learning experience for me. I've gained practical experience in:

- Designing APIs in TypeScript
- Understanding the Kubernetes API and how policies interact with cluster resources
- Setting up testing frameworks for complex projects
- Participating in an open-source community

## What’s Next

There are exciting milestones ahead for the JavaScript SDK:
- We plan to do a proper alpha release of the `policy-sdk-js` soon
- We are creating a template repository for writing Kubewarden policies in JavaScript/TypeScript, similar to what's available for other SDKs
- I will continue to implement API's for the remaining host capabilities
- Finally, we'll be working towards officially publishing the SDK.