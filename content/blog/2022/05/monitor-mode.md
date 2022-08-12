---
title: Introducing the Monitor mode
authors:
- Rafael Fernández López
date: 2022-05-06
---

Policies are a core component of a Kubernetes cluster story that
involves security, compliance and consistency.

Being this process an iterative one, it's common for new policies to
potentially reject operations that we might be issuing today in our
production clusters.

As an example, we might have decided that it's not possible to change
certain annotations on existing resources after the fact. In this
case, we don't want to revoke `UPDATE` rights completely, but just to
define an inalterable set of annotations after the resource has been
created.

Following this example, it might happen that we haven't audited to the
last detail the code that is doing the rollout of existing resources
of our stack.

Deploying this policy in a strict way will make certain rollouts to
not succeed as expected, because some `UPDATE` operations will be
rejected by the policy.

There is some middle ground so that we can evolve our platform, and
still accept these requests: the Monitor mode.

Policies can be deployed now in two different modes: `monitor` and
`protect`. By default, they are deployed in `protect` mode, unless
configured otherwise. This ensures compatibility with the current and
expected behavior.

With the Monitor mode, we are able to deploy new policies so that they
will not reject or mutate any request they might be targeting. The
rest of the mechanism for policy evaluation will work as usual, so
that you can still:

- Inspect the `policy-server` logs and traces for actions this policy
  would have taken had it been in `protect` mode.

- Inspect the `policy-server` metrics, given the mode is now part of
  the metric baggage.

## Transitioning the mode

Given an existing policy, it's possible for it to transition from
`monitor` to `protect` mode, but not the other way around.

This ensures that users with RBAC permissions to update policies can
only make the policy more strict, never less strict. In order for a
policy to transition from `protect` to `monitor` it would need to be
deleted and recreated in `monitor` mode, what would require `DELETE`
permissions.

## Wrapping up

We think the Monitor mode is very interesting for organizations to
start adopting policy-as-code in a safer way, so they can be confident
about the consequences deploying new policies will have on their
existing operations.

You can read more about the Monitor mode in [our
documentation](https://docs.kubewarden.io/operator-manual/monitor-mode/intro.html).

Stay tuned for more and thrilling features in the UX side of
Kubewarden!
