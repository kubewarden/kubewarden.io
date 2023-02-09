---
title: Writing your first policy with Kubewarden
authors:
    - Rafael Fernández López
date: 2021-06-02
---

Kubewarden is a project focused on security and compliance. Its main
goal is to allow you to write, test, distribute and run policies using
the tooling that you already know and master, with a focus on
controlling Kubernetes inner behaviors.

Policies are written in one of the supported languages, and the target
object is a WebAssembly binary artifact. This is how Kubewarden can
ensure that no matter where you built the policy, it can run on all
platforms without any kind of adaptation.

Kubewarden supports both validating and mutating Kubernetes
webhooks. We have published Kubewarden SDKs for different
languages. These allow you to implement your policies and reuse some
common bits and pieces in an idiomatic way.

A policy can be deployed multiple times in the same cluster. This is
so because policies are regular programs, and an important optional
bit of the input we provide the policy is the configuration of the
policy itself. This is how you can have a generic policy that depends
on some configuration provided to it, and thus, behaves in a different
way depending on the instance.

Whether you are developing your own internal policy, for the
community, or are looking to try some policies you found in the wild
in our [Policy Hub](https://hub.kubewarden.io), chances are that you
want to check if the policy behaves as you expect -- leaving aside the
fact that you might want to audit it; we will cover it in a future
blog post. --

Enough of an introduction. Let's get our feet wet!

## The policy idea

Let's write a simple policy that has to do with internal company
compliance. Let's say that in your organization, all teams have an
identifier, and that all the namespaces in your cluster must meet the
following requirements:

- Name is prefixed with the team identifier owning the namespace
    - Due to internal company compliance, all team identifiers follow
      the pattern `t-\w+-\w+`.
- The following annotation keys are required. The annotation names are
  also part of the compliance rules and agreed upon within the
  company:
    - `compliance.my-company.com/team-contact-email`
        - Must be a syntactically valid email ending with our company
          domain.
    - `compliance.my-company.com/team-region`
        - Allowed values: `AMER` (North, Central and South America),
          `APAC` (Asia-Pacific), `EMEA` (Europe, Middle-East and
          Africa).

The policy won't allow the creation of new namespaces that don't
follow any of these rules.

That's it for now. I am sure you already have in mind several ways to
enrich, improve and secure this simple policy.

## The language

At the time of writing we have SDKs for the following languages:

- [Rust](https://github.com/kubewarden/policy-sdk-rust)
- [Swift](https://github.com/kubewarden/policy-sdk-swift)
- [TinyGo](https://github.com/kubewarden/policy-sdk-go)

This list is not static and more will be implemented over time. If you
want to know more about the SDKs and the languages we support and why,
you can [extend the read through the Kubewarden
book](https://docs.kubewarden.io/writing-policies/index.html#programming-language-requirements).

We are going to write our policy in Go, thus, we will use the TinyGo
compiler.

In general, starting a new policy is a matter of using the policy
template we have on GitHub, except for Rust, that has a dedicated
tool. You can find more information [in the
book](https://docs.kubewarden.io/).

## The policy

We head to the [`go-policy-template`
repo](https://github.com/kubewarden/go-policy-template) and use that
template, creating a repository in one of our GitHub organizations.

### Prerequisites

We clone the repository we just generated from the template
locally. Your organization and repository name depend on what you
chose on the GitHub web interface when using the template:

```console
$ git clone git@github.com:your-organization/your-templated-policy.git
```

> **Note**: you will need `docker` or `podman` installed for this
> exercise. At the time of writing, the policy template's `Makefile`
> calls to the `docker` CLI, so if you use `podman`, make sure you
> also have a `docker` wrapper or symlink in your `$PATH`. This is so
> you don't have to install TinyGo yourself.

Let's perform a sanity check by running `make`:

```console
$ rm -rf vendor
$ make
```

> **Note**: we remove the `vendor` folder so dependencies will be
> fetched on every build. This is just for the sake of ease of build
> for the blog post: you don't need to do `go mod tidy` and `go mod
> vendor` afterwards when we add more dependencies, so you don't need
> to have any kind of Go toolchain with the right versions on your
> machine -- a simple `make` will build it, a little bit slower than
> vendored, but still. --

We can see that as a result of the previous command, the sample policy
that the template contains has been built in a file called
`policy.wasm`.

```console
$ file policy.wasm
policy.wasm: WebAssembly (wasm) binary module version 0x1 (MVP)
```

Looks about right! Now, let's go ahead and write our policy!

### Policy first go

Let's start by editing the `main.go` file. For the sake of blog post
brevity, I'll keep the code on the `main.go` file, so it's
straightforward to follow. Also, I'll be skipping some other best
practices, like TDD or even having unit tests, again for the sake of
brevity.

```go
package main

import (
	wapc "github.com/wapc/wapc-guest-tinygo"
	kubewarden "github.com/kubewarden/policy-sdk-go"
)

func main() {
	wapc.RegisterFunctions(wapc.Functions{
        // function that validates the k8s request
		"validate": func(payload []byte) ([]byte, error) {
			return kubewarden.AcceptRequest()
		},
        // function that validates the policy settings
		"validate_settings": func(payload []byte) ([]byte, error) {
			return kubewarden.AcceptSettings()
		},
	})
}
```

Now we have a program, but we don't have a way to know if it does what
we want. This instance is pretty trivial, right? It does nothing. It
just accepts the request as if there was no policy at all. If policy
ghosting was a thing, this would be it.

On the upside, though, we have a Wasm target object that we can run
everywhere, provided we have the right Wasm engine tooling on the
host. How cool is that?

Take into account that despite the function is named
`AcceptRequest()`, this doesn't mean the request will be accepted, it
just means that this policy will not reject it. Other active webhooks
or policies could reject it though. Rejecting is final: if only one
webhook or policy rejects the request, it will be rejected.

## Dry running

In order to dry run our policy we will use the [`kwctl` command-line
tool](https://github.com/kubewarden/kwctl). You can go to the
[releases page](https://github.com/kubewarden/kwctl/releases/), and
fetch the latest one.

Check that the tool is correctly installed:

```console
$ kwctl --version
kwctl 0.1.1
```

You can inspect the `kwctl` commands by running `kwctl
--help`. However, we will focus on the `run` command in this post.

In order to run a policy, you need two mandatory things:
- The policy to be executed (the `policy.wasm` file we produced
  earlier as a first smoke test, and that we will really implement in
  the next section of this post).
- The request to be evaluated
    - This is the [Kubernetes `AdmissionReview`
  object](https://github.com/kubernetes/api/blob/v0.21.1/admission/v1beta1/types.go#L34-L42),
  or the [`AdmissionRequest` object it
  contains](https://github.com/kubernetes/api/blob/v0.21.1/admission/v1beta1/types.go#L45-L118). Any
  of those will work. It has to be provided in JSON format, that is
  how the Kubernetes API server informs the webhook, and thus, the
  policy.

Now we need a request to be evaluated. We can retrieve this request by
auditing the API server, but I will hand you an example, given the
goal of this post is not to record or audit requests :)

```json
{
	"kind": "AdmissionReview",
	"apiVersion": "admission.k8s.io/v1",
	"request": {
		"uid": "150d1761-43fb-4f36-bb73-7a3888a0bca2",
		"kind": {
			"group": "",
			"version": "v1",
			"kind": "Namespace"
		},
		"resource": {
			"group": "",
			"version": "v1",
			"resource": "namespaces"
		},
		"requestKind": {
			"group": "",
			"version": "v1",
			"kind": "Namespace"
		},
		"requestResource": {
			"group": "",
			"version": "v1",
			"resource": "namespaces"
		},
		"name": "test-policy-ns",
		"namespace": "test-policy-ns",
		"operation": "CREATE",
		"userInfo": {
			"username": "kubernetes-admin",
			"groups": ["system:masters", "system:authenticated"]
		},
		"object": {
			"kind": "Namespace",
			"apiVersion": "v1",
			"metadata": {
				"name": "test-policy-ns",
				"uid": "2cc6b1fc-7896-4091-b9c3-e034c89c0535",
				"creationTimestamp": "2021-05-27T15:55:39Z",
				"managedFields": [{
					"manager": "kubectl",
					"operation": "Update",
					"apiVersion": "v1",
					"time": "2021-05-27T15:55:39Z",
					"fieldsType": "FieldsV1",
					"fieldsV1": {
						"f:status": {
							"f:phase": {}
						}
					}
				}]
			},
			"spec": {
				"finalizers": ["kubernetes"]
			},
			"status": {
				"phase": "Active"
			}
		},
		"oldObject": null,
		"dryRun": false,
		"options": {
			"kind": "CreateOptions",
			"apiVersion": "meta.k8s.io/v1"
		}
	}
}
```

I save this request as `request.json`. Now, we have all the
ingredients to dry run the policy, so let's do it:

```console
$ kwctl run policy.wasm --request-path request.json 2> /dev/null | jq
{
  "uid": "150d1761-43fb-4f36-bb73-7a3888a0bca2",
  "allowed": true
}
```

As expected, the response of the policy is that the request is
accepted. This is a really good start! Now, let's go and write the
real policy logic.

## Policy implementation

We have to implement three main checks based on the restrictions that
have been described by our compliance team:

1. The namespace name has to meet a specific prefix format
   (`t-\w+-\w+` -- e.g. `t-ei-billing`, `t-sre-security`...)
1. Two annotations have to exist:
    1. `compliance.my-company.com/team-contact-email`: has to be an
    email address with the host part pointing to `@my-company.com`; we
    won't allow other domain names as contact email.
    1. `compliance.my-company.com/team-region`: has to be one (and
only one) of `AMER`, `APAC` or `EMEA`.

Let's implement the first check:

```go
package main

import (
	"fmt"
	"github.com/kubewarden/gjson"
	kubewarden "github.com/kubewarden/policy-sdk-go"
	"regexp"
	wapc "github.com/wapc/wapc-guest-tinygo"
)

func main() {
	wapc.RegisterFunctions(wapc.Functions{
        // function that validates the k8s request
		"validate": func(payload []byte) ([]byte, error) {
            // extract the name of the namespace by looking into the resource metadata attribute
			namespaceName := gjson.GetBytes(payload, "request.object.metadata.name")
			namespaceNameMatches, err := regexp.MatchString(`^t-\w+-\w+`, namespaceName.String())
			if err != nil {
				return kubewarden.RejectRequest(kubewarden.Message(fmt.Sprintf("internal error while processing namespace '%s': %v", namespaceName, err)), kubewarden.NoCode)
			}
			if !namespaceNameMatches {
				return kubewarden.RejectRequest(kubewarden.Message(fmt.Sprintf("namespace '%s' does not comply with the company namespace naming convention: check https://internal.my-company.com/k8s/naming-conventions.md for more information", namespaceName)), kubewarden.NoCode)
			}
			return kubewarden.AcceptRequest()
		},
        // function that validates the policy settings
        "validate_settings": func(payload []byte) ([]byte, error) {
			return kubewarden.AcceptSettings()
		},
	})
}
```

Now the policy will check that the namespace name is compliant with
the naming rule.

If we try to create a namespace that does not follow this pattern,
like the previous `request.json` file, we will receive the following
error:

```console
$ kwctl run policy.wasm --request-path request.json 2> /dev/null | jq
{
  "uid": "150d1761-43fb-4f36-bb73-7a3888a0bca2",
  "allowed": false,
  "status": {
    "message": "namespace 'test-policy-ns' does not comply with the company namespace naming convention: check https://internal.my-company.com/k8s/naming-conventions.md for more information"
  }
}
```

Now let's implement the rest of the checks:

```go
package main

import (
	"fmt"
	"github.com/kubewarden/gjson"
	kubewarden "github.com/kubewarden/policy-sdk-go"
	"regexp"
	wapc "github.com/wapc/wapc-guest-tinygo"
)

func main() {
	wapc.RegisterFunctions(wapc.Functions{
		"validate": func(payload []byte) ([]byte, error) {
            // extract the name of the namespace by looking into the resource metadata attribute
			namespaceName := gjson.GetBytes(payload, "request.object.metadata.name")
			namespaceNameMatches, err := regexp.MatchString(`^t-\w+-\w+`, namespaceName.String())
			if err != nil {
				return
			kubewarden.RejectRequest(kubewarden.Message(fmt.Sprintf("[compliance] internal error while processing namespace '%s': %v", err)), kubewarden.NoCode)
			}
			if !namespaceNameMatches {
				return kubewarden.RejectRequest(kubewarden.Message(fmt.Sprintf("[compliance] namespace '%s' does not comply with the company namespace naming convention: check https://internal.my-company.com/k8s/naming-conventions.md for more information", namespaceName)), kubewarden.NoCode)
			}
			teamContactEmail := gjson.GetBytes(payload, "request.object.metadata.annotations.compliance\\.my-company\\.com/team-contact-email").String()
			if teamContactEmail == "" {
				return kubewarden.RejectRequest(kubewarden.Message(fmt.Sprintf("[compliance] the namespace '%s' is missing a mandatory annotation compliance.my-company.com/team-contact-email", namespaceName)), kubewarden.NoCode)
			}
			teamContactEmailValidDomain, err := regexp.MatchString(`@my-company\.com$`, teamContactEmail)
			if err != nil {
				return kubewarden.RejectRequest(kubewarden.Message(fmt.Sprintf("[compliance] internal error while processing namespace: %v", err)), kubewarden.NoCode)
			}
			if !teamContactEmailValidDomain {
				return kubewarden.RejectRequest(kubewarden.Message(fmt.Sprintf("[compliance] the namespace '%s' does not comply with the company namespace naming convention: the compliance.my-company.com/team-contact-email annotation must end with @my-company.com", namespaceName)), kubewarden.NoCode)
			}
			teamRegion := gjson.GetBytes(payload, "request.object.metadata.annotations.compliance\\.my-company\\.com/team-region").String()
			if teamRegion != "AMER" && teamRegion != "APAC" && teamRegion != "EMEA" {
				return kubewarden.RejectRequest(kubewarden.Message(fmt.Sprintf("[compliance] the namespace '%s' does not comply with the company namespace naming convention: the compliance.my-company.com/team-region annotation must be one of: AMER, APAC or EMEA; is: '%s'", namespaceName, teamRegion)), kubewarden.NoCode)
			}
			return kubewarden.AcceptRequest()
		},
		"validate_settings": func(payload []byte) ([]byte, error) {
			return kubewarden.AcceptSettings()
		},
	})
}
```

Despite the checks can be improved further, we have an initial
implementation of the policy that checks for compliance of the
namespace for our organization.

However, as you can see, we have a number of hardcoded logic, messages
and bits that could be parameters. This way, we can have a pattern
that can be reused with different parameters. Depending on the policy,
you might even have multiple instances of the policy with different
settings -- potentially targeting different resources or HTTP verbs,
so they could perform potentially different checks.

Now, let's close the circle, and test a valid request against our
latest policy. I will save this request as `valid-request.json`:

```json
{
	"kind": "AdmissionReview",
	"apiVersion": "admission.k8s.io/v1",
	"request": {
		"uid": "150d1761-43fb-4f36-bb73-7a3888a0bca2",
		"kind": {
			"group": "",
			"version": "v1",
			"kind": "Namespace"
		},
		"resource": {
			"group": "",
			"version": "v1",
			"resource": "namespaces"
		},
		"requestKind": {
			"group": "",
			"version": "v1",
			"kind": "Namespace"
		},
		"requestResource": {
			"group": "",
			"version": "v1",
			"resource": "namespaces"
		},
		"name": "t-ei-billing",
		"namespace": "t-ei-billing",
		"operation": "CREATE",
		"userInfo": {
			"username": "kubernetes-admin",
			"groups": ["system:masters", "system:authenticated"]
		},
		"object": {
			"kind": "Namespace",
			"apiVersion": "v1",
			"metadata": {
				"name": "t-ei-billing",
				"uid": "2cc6b1fc-7896-4091-b9c3-e034c89c0535",
				"creationTimestamp": "2021-05-27T15:55:39Z",
				"annotations": {
					"compliance.my-company.com/team-contact-email": "ei-billing@my-company.com",
					"compliance.my-company.com/team-region": "EMEA"
				},
				"managedFields": [{
					"manager": "kubectl",
					"operation": "Update",
					"apiVersion": "v1",
					"time": "2021-05-27T15:55:39Z",
					"fieldsType": "FieldsV1",
					"fieldsV1": {
						"f:status": {
							"f:phase": {}
						}
					}
				}]
			},
			"spec": {
				"finalizers": ["kubernetes"]
			},
			"status": {
				"phase": "Active"
			}
		},
		"oldObject": null,
		"dryRun": false,
		"options": {
			"kind": "CreateOptions",
			"apiVersion": "meta.k8s.io/v1"
		}
	}
}
```

Now, we can run this policy against the `valid-request.json` request:

```console
$ kwctl run policy.wasm --request-path valid-request.json 2> /dev/null | jq
{
  "uid": "150d1761-43fb-4f36-bb73-7a3888a0bca2",
  "allowed": true
}
```

Feel free to play with the request. You can modify the annotations or
naming of the namespace, and check the error result you get back if
the request is not compliant.

And so, we can see that the policy behaves as we expect! We have seen
some aspects of Kubewarden and the policy cycle:

- How to write a policy from scratch
- How to test a policy with different requests

However, for your policy to be active on a Kubernetes cluster there
are some bits and pieces we are still missing. The main questions at
this point are:

- How to safely make the policy easy to distribute
    - Kubewarden has focused on reusing your existing knowledge
      and tools, so policies can either be distributed using an HTTPS
      server, or preferrably, an OCI registry.
- How to deploy the policy to a Kubernetes cluster
    - We have created the [`kubewarden-controller`
      project](https://github.com/kubewarden/kubewarden-controller)
      that makes it trivial to deploy policies inside your cluster,
      once the previous point has been covered.
- How can I connect the policy in Kubernetes? How can I establish what
  type of requests will be evaluated by a policy?

There are also some open questions, such as: what happens if a
resource that was accepted with a previous revision of a policy now
would be rejected with the latest policy version? In a living and
evolving environment that holds state this is a common
situation. Kubewarden has also plans to have you covered in this case.

We will cover these topics in a much broader way in future blog
posts.

## Conclusion

Thank you for reading up to this point, we hope you enjoyed the post!

We have seen how to build a policy from scratch, in this case using Go
(and the TinyGo compiler). We have also seen that there are more SDKs
available to you such as the Rust and Swift ones.

We have also covered how to test a policy once we have the WebAssembly
binary artifact, so we can run tests against the policy, ensuring that
it behaves as we expect.

There are some open questions regarding the policy distribution and
running policies in a Kubernetes cluster that we opened in the last
section, and that we will cover in future blog posts.

Stay tuned and thank you for reading!
