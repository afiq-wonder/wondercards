# CORE_SPEC

## Purpose

Core is the kernel of WonderOS. It provides the foundational services
that every other layer depends on.

## Responsibilities

-   Event Bus
-   Event contracts
-   Shared primitives
-   Runtime abstractions
-   Common utilities

## Dependency Rule

Core depends on nothing.

## Public Interfaces

-   WonderEventBus
-   WonderEvents
-   Core contracts

## Non-Goals

-   Product logic
-   React components
-   Platform orchestration
