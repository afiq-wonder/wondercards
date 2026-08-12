# WonderOS Repository Rules

**Version:** 1.0\
**Status:** Active\
**Owner:** WonderLabs\
**Last Updated:** 2026-07-29

------------------------------------------------------------------------

# Purpose

This document defines the mandatory engineering rules for every
contributor, whether human or AI, working on the WonderOS repository.

These rules exist to protect architectural consistency and long-term
maintainability.

------------------------------------------------------------------------

# Rule 1 --- One Repository

WonderOS is the platform.

WonderCards is a product built on the platform.

Do not create independent application structures that duplicate the
platform.

------------------------------------------------------------------------

# Rule 2 --- One Source of Truth

Every domain model must exist exactly once.

Examples:

-   WonderCard
-   WonderDNA
-   WonderGenome
-   WonderMoment

Duplicate models are not permitted.

------------------------------------------------------------------------

# Rule 3 --- Folder Ownership

## app/

Application entry only.

## components/

Reusable UI only.

No business logic.

## engine/

Pure business logic.

No React.

## platform/

Shared platform services.

## core/

Kernel of WonderOS.

Core must not depend on Platform, Components or Products.

## data/

Static data only.

## types/

Canonical shared types.

## tests/

Automated tests.

------------------------------------------------------------------------

# Rule 4 --- Import Standards

Always use project aliases.

Good:

``` ts
import { WonderCard } from "@/types/wonderCard";
```

Avoid deep relative imports such as:

``` ts
../../../components/Button
```

------------------------------------------------------------------------

# Rule 5 --- Component Standards

Components should:

-   Render UI
-   Receive props
-   Emit events

Components should not:

-   Query databases
-   Contain business rules
-   Manage platform state

------------------------------------------------------------------------

# Rule 6 --- Engine Standards

Engines should:

-   Be deterministic
-   Be framework independent
-   Be testable

Engines must not import React.

------------------------------------------------------------------------

# Rule 7 --- Platform Standards

Platform services coordinate application behaviour.

They may use Core.

They must not depend on product-specific features.

------------------------------------------------------------------------

# Rule 8 --- Core Standards

Core is the foundation.

It should expose shared contracts, events and primitives only.

Nothing below Core exists.

------------------------------------------------------------------------

# Rule 9 --- Documentation First

Before major architecture changes:

1.  Update specifications.
2.  Update architecture documents.
3.  Implement code.

------------------------------------------------------------------------

# Rule 10 --- Git Hygiene

Never commit:

-   .next
-   node_modules
-   runtime backups
-   temporary files
-   generated caches

Commit only source code, tests and documentation.

------------------------------------------------------------------------

# Rule 11 --- Naming

Folders: kebab-case

React Components: PascalCase

Utilities: camelCase

Shared Types: PascalCase

------------------------------------------------------------------------

# Rule 12 --- Testing

Every engine should have automated tests.

Critical platform services should be covered by integration tests.

------------------------------------------------------------------------

# Rule 13 --- AI Contributor Policy

AI contributors must:

-   Respect the repository structure.
-   Reuse existing modules.
-   Avoid duplicate models.
-   Justify architectural changes.

------------------------------------------------------------------------

# Rule 14 --- Repository Evolution

Refactor before duplication.

Reuse before rewriting.

Stabilise before expanding.

------------------------------------------------------------------------

# Engineering Oath

> Every change should make WonderOS easier to understand, easier to
> maintain, and easier to extend.
