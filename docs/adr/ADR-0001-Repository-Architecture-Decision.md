# ADR-0001 --- Repository Architecture Decision

**Status:** Accepted **Date:** 2026-07-29

## Context

WonderOS has evolved from a single application into a platform
supporting multiple products.

## Decision

Maintain a single repository with a platform-first structure. Products
live on top of shared platform capabilities.

## Consequences

-   Shared tooling
-   Shared types
-   Easier cross-product reuse
-   Consistent engineering standards
