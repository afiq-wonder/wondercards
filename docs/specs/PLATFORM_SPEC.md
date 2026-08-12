# PLATFORM_SPEC

## Purpose

Platform coordinates reusable application capabilities.

## Modules

-   WonderDNA: Persistent family profile.
-   WonderGenome: Generated configuration for an experience.
-   WonderCycle: Experience lifecycle.
-   Providers: Shared application context.

## Lifecycle

WonderDNA → WonderGenome → WonderCycle → Product Experience

## Rules

Platform may depend on Core and Engine, never on product-specific
implementations.
