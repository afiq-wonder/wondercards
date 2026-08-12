# WonderOS Dependency Rules

## Allowed

Products → Platform → Engine → Core

## Core

Depends on nothing.

## Engine

May depend on Core.

## Platform

May depend on Core and Engine.

## Components

May depend on Platform but should not contain business logic.

## Forbidden

-   Core → Platform
-   Core → Components
-   Engine → React UI
-   Shared types duplicated across modules
