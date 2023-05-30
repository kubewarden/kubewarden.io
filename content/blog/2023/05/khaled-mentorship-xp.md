---
title: My Experience in the LFX Mentorship Program with the Linux Foundation
authors:
- Khaled Emara
date: 2023-05-30
---

> This text was originally written by Khaled Emara on his [blog](https://blog.khaledemara.dev/my-experience-in-the-lfx-mentorship-program-with-the-linux-foundation?showSharer=true).

Hi, I'm Khaled Emara, a software developer with a background in Go and Rust programming.
In this blog post, I'm excited to share my experience in the LFX mentorship program
with the Linux Foundation and my work on the Kubewarden project enhancing the Go
SDK to bring it parity with the Rust SDK.

The Kubewarden project is a security policy engine for Kubernetes, a popular container
orchestration platform. As more and more businesses move their applications to the
cloud, containers have become an increasingly popular way to manage and deploy applications.
However, with this rise in popularity, there has also been a corresponding rise in
security concerns. The Kubewarden project addresses these concerns by providing a
way to enforce security policies in Kubernetes.

## The Challenge

When I joined the LFX mentorship program, I was excited to work on the Kubewarden project.
My task was to implement the Go SDK to bring it parity with the existing Rust SDK.
This was a challenging task because the Rust SDK had more features and was more mature than the Go SDK.

I started by researching the Rust SDK and understanding its architecture. Then, I began
working on the Go implementation. I encountered several challenges along the way,
including differences in syntax and language features between Rust and Go.
However, with the help of my mentor and the Kubewarden community, I was able to
overcome these challenges and make significant progress on the project.

## The Mentorship Experience

The LFX mentorship program was an incredible experience. I received support from
my mentor and other experienced developers in the Kubewarden community. We had regular
meetings and code reviews, and I was able to get feedback on my work and learn from
other's expertise.

I also had access to a variety of collaboration tools, such as GitHub and Slack,
which made it easy to communicate and work with my mentor and the community.
I felt like I was part of a team, and that made the experience even more rewarding.

I learned a lot while implementing the SDK APIs. A great portion of them was about
container signing to make sure the containers are from a known source.  These were
implemented using the Sigstore project.

The [Sigstore project](https://www.sigstore.dev/) is an open-source project that aims to make software signing
and verification more transparent and accessible. By providing a secure and easy-to-use
signing platform, the sigstore project helps developers ensure the security and integrity
of their software. By using cryptographic signatures, developers can ensure that their
software has not been tampered with and that it is authentic and trustworthy.

Implementing the Sigstore APIs in the Kubewarden project was not without its challenges.
I had to ensure that the APIs were secure, reliable, and easy to use. I also had
to ensure that they were compatible with the Kubewarden project's existing architecture and design.

Finally, I had to test what I was implementing. To do this I had to learn about
Go Mock testing.

Go mock testing is an essential part of software testing that allows developers
to simulate complex scenarios and isolate specific parts of their code. During my
LFX mentorship program, I learned about the importance of Go mock testing and how
it can improve the quality and reliability of software.

Go mock testing is a technique used to simulate dependencies and input/output scenarios
to test specific parts of code. It allows developers to isolate parts of the codebase
and test them in isolation, without having to rely on real-world data or external dependencies.

Mock testing involves creating "mock" objects that mimic the behavior of real objects
but can be controlled and manipulated by the developer. These mock objects can be
used to simulate different scenarios and test the code's response to each scenario.

During my LFX mentorship program, I learned about Go mock testing and its importance
in ensuring the quality of software. I applied this knowledge to the Kubewarden project,
where I used Go mock testing to isolate and test specific parts of the codebase.

One of the challenges I faced was creating mock objects that accurately simulated
real-world scenarios. However, with the help of my mentor and the Kubewarden community,
I was able to refine my approach and create effective mock objects.

Some best practices for Go mock testing include using it to test specific parts of
code in isolation, creating mock objects that accurately simulate real-world scenarios,
and integrating mock testing into your overall testing suite.

There are also several tools and libraries available to help with Go mock testing,
such as the [`gomock`](https://github.com/golang/mock) package and the [`testify`](https://github.com/stretchr/testify) library.

Go mock testing can help catch bugs earlier in the development process, improve the
reliability and maintainability of code, and enhance the overall quality of software.
By simulating different scenarios, developers can identify and address potential
issues before they become major problems.

In the context of the Kubewarden project, Go mock testing helped me identify and
fix issues with specific parts of the codebase, which ultimately improved the
overall reliability and security of the project.

## Results and Impact

After several weeks of hard work, I was able to bring the Go SDK parity with the Rust SDK.
This meant that Kubewarden users could now use the Go SDK to implement security policies in Kubernetes.
This was a significant achievement, and I was proud to have contributed to the project in this way.

My work on the Kubewarden project has had a significant impact on the community.
It has improved the project's versatility and made it more accessible to developers
who prefer to work in Go. Additionally, my participation in the LFX mentorship program
has helped me gain new skills and confidence in my abilities as a developer.

## Conclusion

Overall, my experience in the LFX mentorship program with the Linux Foundation and
working on the Kubewarden project was incredibly rewarding. I had the opportunity
to work on a real-world project alongside experienced developers, and I was able
to make a meaningful contribution to the open-source community.

I am grateful for the support I received from my mentor and the Kubewarden community,
as well as the tools and resources provided by the LFX mentorship program. This
experience has helped me grow as a developer and has opened up new opportunities
for me in the field of cloud-native security.

I would encourage anyone interested in open-source development or cloud-native security
to consider participating in the LFX mentorship program with the Linux Foundation.
It's a unique opportunity to learn from experienced developers and make a meaningful
contribution to the open-source community.

Thank you to the Linux Foundation and the Kubewarden community for this opportunity,
and I look forward to continuing to contribute to open-source projects in the future.
