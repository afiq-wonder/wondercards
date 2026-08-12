# WonderOS Testing Standard

## Purpose

Ensure reliability through automated testing.

## Test Pyramid

-   Unit Tests (Engine, Core)
-   Integration Tests (Platform, Event Bus)
-   End-to-End Tests (Products)

## Requirements

-   Every engine must have unit tests.
-   Critical platform services require integration tests.
-   Bugs must be reproduced with a failing test before fixing.

## Coverage Goals

-   Core: 95%+
-   Engine: 90%+
-   Platform: 80%+
-   UI: Critical user flows only.
