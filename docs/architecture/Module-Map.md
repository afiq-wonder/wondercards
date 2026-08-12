# Module Map

**Version:** 1.0 (Draft)

---

# Purpose

This document describes the responsibility of every major repository module.

Each module should have one primary responsibility.

---

# Repository Map

```

app/

```

Application entry.

Responsible for routing and pages.

Depends on:

- components

- runtime

---

```

components/

```

UI components.

Reusable.

No business logic.

Depends on:

- core

---

```

engine/

```

Wonder Engines.

Responsible for experience generation.

Examples:

- Coral

- Journey

- Future engines

Depends on:

- core

---

```

runtime/

```

Application execution.

Responsible for state and flow.

Depends on:

- engine

- platform

---

```

platform/

```

Infrastructure.

Services.

Storage.

Utilities.

Shared platform code.

---

```

core/

```

Shared business logic.

Models.

Utilities.

Types.

Validation.

No UI.

---

```

sdk/

```

Reusable APIs.

Developer integrations.

---

```

worker/

```

Background processing.

Scheduled tasks.

Async jobs.

---

```

director/

```

Internal orchestration tools.

Used during content production.

---

```

builders/

```

Internal generation pipelines.

Asset creation.

Automation.

---

```

studio/

```

Internal creator tools.

Not shipped to users.

---

```

content/

```

WonderCards.

Stories.

Assets.

Localization.

---

```

design/

```

Brand assets.

Illustrations.

Motion.

UI resources.

---

```

tests/

```

Automated testing.

Unit tests.

Integration tests.

Regression tests.

---

```

archive/

```

Historical projects.

Deprecated systems.

Reference implementations.

---

# Dependency Rules

Allowed direction:

```

UI

↓

Runtime

↓

Engine

↓

Core

↓

Platform

```

Modules should not create circular dependencies.

---

# Golden Rules

Every module has one responsibility.

Prefer composition over duplication.

Document architectural changes.

Write tests for critical behaviour.

Keep the repository understandable for both humans and AI.