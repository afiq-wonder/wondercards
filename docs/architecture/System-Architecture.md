# WonderCards System Architecture

**Version:** 1.0 (Draft)

---

# Purpose

This document provides a high-level overview of the WonderCards platform architecture.

It explains how the major systems interact to deliver the WonderCards experience.

---

# Architecture Principles

WonderCards follows these principles:

- Modular

- Documentation First

- Offline-first experiences

- AI-assisted development

- Testable systems

- Replaceable components

Every module should have a single responsibility.

---

# High-Level Architecture

```

                 Users

                    │

                    ▼

          ┌───────────────────┐

          │ Next.js Application│

          └─────────┬──────────┘

                    │

        ┌───────────┼───────────┐

        ▼           ▼           ▼

   UI Components   Runtime    Platform

        │           │           │

        ▼           ▼           ▼

     Wonder Engine  Journey Engine  Coral

        │           │           │

        └───────────┼───────────┘

                    ▼

              Shared Core

                    ▼

             Content / Assets

```

---

# Layer Overview

## Presentation Layer

Responsible for user interaction.

Examples:

- app/

- components/

---

## Experience Layer

Responsible for creating Wonder experiences.

Examples:

- engine/

- journey/

- coral/

---

## Platform Layer

Responsible for application services.

Examples:

- platform/

- runtime/

---

## Core Layer

Shared business logic.

Examples:

- core/

---

## Content Layer

WonderCards

Stories

Assets

Prompts

Media

---

# Design Philosophy

The application should remain modular.

UI should never contain business logic.

Business logic should never depend on UI.

Content should be replaceable.

Runtime should remain independent.

---

# Future Expansion

The architecture supports:

- mobile applications

- web

- PWA

- AI companions

- additional Wonder Engines

- new adventure packs

- localization