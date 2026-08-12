# MODULE_BOUNDARIES

## Layer Order

Products ↓ Components ↓ Platform ↓ Engine ↓ Core

## Responsibilities

### Products

User-facing applications.

### Components

Presentation layer only.

### Platform

Shared orchestration and lifecycle.

### Engine

Business rules and deterministic execution.

### Core

Kernel and shared contracts.

## Forbidden Dependencies

-   Core → Platform
-   Core → Components
-   Engine → React
-   Components → Engine business logic
-   Products bypassing Platform
