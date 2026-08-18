# WonderLabs Backend Principles

**Version:** 1.0

---

# Purpose

These principles define how WonderLabs products protect secrets, enforce access, control AI usage, and isolate infrastructure risk.

They apply across WonderCards, AI UGC Studio, AI Fitting Room, and future WonderLabs products.

The goal is not to make compromise impossible. The goal is to reduce blast radius, protect privileged systems, and keep monetization and provider control server-side.

---

# Principle 1 — The Client Is Untrusted

Browser, mobile, desktop, and packaged clients must be treated as user-controlled environments.

The client may display state, but it must never be the authority for:

- subscription tier
- feature entitlement
- usage allowance
- billing status
- privileged access
- secret credentials
- provider selection rules that affect protected cost or capability

The server is the authority.

---

# Principle 2 — Secrets Never Ship to the Client

Provider API keys, service-role credentials, signing secrets, and privileged tokens must remain behind a server-side boundary.

Secrets must not be committed to source control, embedded in frontend bundles, stored in localStorage, or returned to the client.

Use managed server-side secrets or environment variables.

Temporary local test credentials are development-only and must never become the production design.

---

# Principle 3 — Server-Enforced Entitlements

Free, paid, pro, founding, internal, and future plans must be enforced server-side.

The client may request a protected action, but the backend must independently verify:

1. Who is making the request?
2. Is the user authenticated when authentication is required?
3. Which plan or entitlement applies?
4. Is the requested feature allowed?
5. Is usage within quota?
6. Is the request within rate limits?
7. Is the request safe and structurally valid?

Only then may protected infrastructure be used.

---

# Principle 4 — AI Providers Are Replaceable Infrastructure

WonderLabs products must not depend directly on one AI provider.

Product logic talks to a provider-neutral adapter or gateway.

Preferred pattern:

Client Product
→ Product AI Adapter
→ WonderLabs Backend Gateway
→ Provider Adapter
→ Gemini / OpenRouter / future provider

Provider changes must not require rebuilding product intelligence.

---

# Principle 5 — The Backend Is the Secure Execution Boundary

Protected operations should execute behind a backend gateway.

For AI workloads, the backend is responsible for:

- retrieving provider secrets
- validating requests
- enforcing entitlements
- enforcing quotas
- applying rate limits
- selecting allowed models
- recording usage
- handling retries and provider failures
- returning only the minimum result required by the client

Supabase Edge Functions may serve this role where appropriate, but the principle is platform-neutral.

---

# Principle 6 — Minimize Blast Radius

Assume that any public client can be inspected, modified, copied, or reverse engineered.

A compromised client must not automatically expose:

- provider API keys
- privileged database credentials
- unrestricted AI inference
- administrative capabilities
- other users' data
- billing controls

Every boundary should reduce what an attacker can reach next.

---

# Principle 7 — Monetization Is a Backend Concern

Pricing and entitlement logic may be presented in the UI, but protected capability must be enforced by the backend.

Example:

Free User
→ small analysis allowance

Paid User
→ larger allowance

Pro User
→ premium capability and higher limits

Changing frontend JavaScript from `free` to `pro` must never grant additional protected usage.

---

# Principle 8 — Usage Must Be Measurable

Every cost-bearing or abuse-sensitive protected action should be attributable where practical.

Track enough information to answer:

- which user or session initiated the action
- which product initiated it
- which capability was used
- which provider/model was called
- whether it succeeded or failed
- how much quota was consumed

Avoid collecting unnecessary sensitive content merely for observability.

---

# Principle 9 — Fail Closed for Privilege, Fail Gracefully for Experience

If entitlement, authentication, quota, or secret validation fails, protected capability must not execute.

Where possible, the product should still degrade gracefully.

Example for AI UGC Studio:

Gemini unavailable
→ do not expose or bypass protected Gemini access
→ fall back to local campaign generation where safe

Security failure must never become authorization bypass.

---

# Principle 10 — Maintenance Happens Behind Stable Interfaces

Frontend products should depend on stable WonderLabs interfaces, not directly on provider-specific APIs.

Model upgrades, provider migrations, key rotation, pricing changes, fallback routing, and usage policy changes should be handled primarily in backend/provider layers.

The product should remain stable while infrastructure evolves.

---

# Reference Architecture

```text
Public Client
    ↓
Product Adapter
    ↓
WonderLabs Backend Gateway
    ↓
Authentication / Entitlement / Quota / Validation
    ↓
Provider Adapter
    ↓
External AI or Service Provider
```

Secrets exist only below the public-client boundary.

---

# Security Rule

**The client may ask. The server decides.**

No product may rely on client-side state alone to protect money, secrets, privilege, or paid infrastructure.

---

# WonderLabs Backend Standard

Every new WonderLabs product or protected capability should answer these questions before production release:

1. What does the client know?
2. What secrets exist and where are they stored?
3. What does the server independently verify?
4. Where are entitlements enforced?
5. Where are quotas and rate limits enforced?
6. What happens if the public client is modified?
7. What happens if a provider fails?
8. Can the provider be replaced without rewriting the product?
9. What is the blast radius of each credential?
10. Is privileged usage observable and controllable?

If these questions do not have clear answers, the protected capability is not production-ready.

---

# Final Principle

Security, monetization control, and maintainability are not separate concerns.

They are properties of the same architecture.

WonderLabs protects the product by keeping authority, secrets, and protected execution behind boundaries that the public client cannot control.
