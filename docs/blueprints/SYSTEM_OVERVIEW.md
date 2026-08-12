# WonderOS System Overview

## Purpose

WonderOS is the shared software platform for all WonderLabs products.

## Layered Architecture

``` text
WLOS
  ↓
WKS
  ↓
WCSpec / WPSpec
  ↓
WonderOS
  ├─ Core
  ├─ Engine
  ├─ Platform
  ├─ SDK
  ├─ Server
  ├─ Worker
  └─ Studio
        ↓
Products
  ├─ WonderCards
  └─ Future Products
```

## Design Goals

-   Platform-first
-   Reusable modules
-   Shared domain models
-   Event-driven communication
-   Long-term maintainability
