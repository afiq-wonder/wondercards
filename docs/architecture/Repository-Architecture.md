# WonderOS Architecture

**Version:** 1.0\
**Status:** Active\
**Owner:** WonderLabs\
**Last Updated:** 2026-07-29

## Vision

WonderOS is the software platform that powers every WonderLabs product.
WonderCards is the first product built on WonderOS.

## Core Principles

1.  One Repository
2.  One Source of Truth
3.  Platform First
4.  Products Consume Platform
5.  Documentation Drives Architecture
6.  Simple Before Smart
7.  Build for 10 Years, not 10 Days

## Repository Structure

-   app/
-   builders/
-   components/
-   core/
-   data/
-   director/
-   docs/
-   engine/
-   factory/
-   lib/
-   platform/
-   public/
-   sdk/
-   server/
-   studio/
-   tests/
-   types/
-   worker/
-   WCSpec/
-   WKS/
-   WLOS/
-   WPSpec/

## Responsibilities

### core

Kernel of WonderOS containing shared primitives, runtime contracts and
the Event Bus.

### platform

Shared platform services such as DNA, Genome, Cycle and Providers.

### engine

Business execution engines.

### components

Reusable UI components.

### data

Static datasets only.

### types

Canonical shared models. Every model exists exactly once.

### factory

Developer automation.

### sdk

Developer SDK.

### server

Backend services.

### worker

Background jobs.

### studio

Creator tools and publishing.

### builders

Internal build utilities.

### docs

Engineering documentation.

### tests

Automated tests.

### public

Static assets.

## Runtime Directories

-   wonder-factory/
-   wonder-scheduler/
-   wonder-studio/

These are runtime state and should not be treated as production source
code.

## Archive Directories

-   WonderCards-Client-MVP-Beast-Mode/
-   wondercards-sprint-2-full/

Historical reference only.

## Dependency Rules

Products → Platform → Engine → Core

Dependencies should always point downward.

## Source of Truth

Only one canonical definition for:

-   WonderCard
-   WonderDNA
-   WonderGenome
-   WonderMoment

## Git Rules

Never commit:

-   .next
-   node_modules
-   runtime backups
-   generated caches

## Engineering Workflow

1.  Update documentation
2.  Update architecture
3.  Implement
4.  Test
5.  Review
6.  Merge

## WonderOS Layer Model

WLOS → WKS → WCSpec/WPSpec → WonderOS → Wonder Platform → Products

## Architecture Principle

> Build the platform once.
>
> Build many products on top.
>
> Never solve the same problem twice.
