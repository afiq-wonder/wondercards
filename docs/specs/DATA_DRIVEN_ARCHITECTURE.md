# Sprint 8 — Data-Driven Architecture

Version 1.0

---

# Objective

Transform WonderLabs from an engine-driven architecture into a data-driven architecture.

From this sprint onwards, engines should become smaller and simpler.

All creative behaviour should live inside structured data files.

This allows WonderLabs to scale for years without constantly modifying engine logic.

---

# Philosophy

A good engine should execute.

A great engine should interpret.

The best engine should simply read data.

WonderLabs is moving towards an architecture where content creators, writers and designers can expand the experience without touching application logic.

---

# Architecture

```

WonderMoment

↓

WonderGrowthEngine

↓

WonderDNA

↓

WonderIdentityEngine

↓

Personality Database

↓

WonderTreeEngine

↓

Tree Profile Database

↓

CoralDialogueEngine

↓

Dialogue Database

```

Every engine becomes responsible for orchestration.

Every piece of creativity comes from data.

---

# Sprint Goals

## Step 1

Create

```

data/

    personalities.ts

```

This file defines every family personality.

Examples:

- Explorer Family

- Dream Builder Family

- Kind Heart Family

- Adventure Family

- Wonder Explorer Family

Each personality includes:

- Title

- Description

- Greeting

- Tree Style

- Coral Behaviour

- Future Village Style

---

## Step 2

Refactor WonderIdentityEngine.

Remove all hardcoded switch statements.

WonderIdentityEngine should only:

- Read WonderDNA

- Determine dominant traits

- Load the matching personality from the Personality Database

- Return the selected personality

The engine should never contain presentation content.

---

## Step 3

Create

```

data/

    treeProfiles.ts

```

This file defines how every personality appears visually.

Each profile includes:

- Palette

- Environment

- Flower Style

- Leaf Style

- Bird Type

- Butterfly Type

- Music Theme

- Seasonal Style

WonderTreeEngine should simply assemble a tree from this profile.

---

## Step 4

Refactor WonderTreeEngine.

WonderTreeEngine should no longer contain personality-specific logic.

Instead it should:

- Read WonderIdentity

- Load the matching Tree Profile

- Generate the current tree state

Tree balancing remains separate from tree appearance.

---

## Step 5

Create

```

data/

    coralDialogues.ts

```

This becomes Coral's dialogue library.

Dialogue should be organised by:

- Personality

- Adventure Stage

- Greeting

- Celebration

- Encouragement

- Reflection

- Wonder Moments

Coral never generates personality.

Coral expresses personality.

---

## Step 6

Create

```

engine/

    dialogue/

        CoralDialogueEngine.ts

```

Responsibilities:

- Read WonderIdentity

- Read WonderDNA

- Read Dialogue Database

- Select the most appropriate dialogue

- Return a single Coral message

CoralDialogueEngine never contains dialogue directly.

---

# Benefits

This architecture provides:

- Smaller engines

- Cleaner code

- Easier balancing

- Faster content production

- Better scalability

- Lower maintenance costs

Adding new personalities becomes a content task rather than a programming task.

---

# Example

Instead of:

```ts

switch (personality) {

    case "Explorer Family":

        ...

}

```

WonderIdentityEngine should eventually perform:

```

WonderDNA

↓

Explorer Family

↓

personalities.ts

↓

WonderIdentity

```

No engine modifications are required when adding new personalities.

---

# Long-Term Vision

Future additions become straightforward.

Adding:

- Inventor Family

- Ocean Family

- Music Family

- Stargazer Family

- Forest Family

requires only:

```

personalities.ts

```

Adding:

- Crystal Tree

- Sakura Tree

- Coral Tree

- Ancient Tree

requires only:

```

treeProfiles.ts

```

Adding new Coral conversations requires only:

```

coralDialogues.ts

```

The underlying engines remain unchanged.

---

# Design Principle

Engines should know **how**.

Data should define **what**.

This separation keeps WonderLabs flexible, maintainable and ready for long-term growth.

---

# Sprint Deliverables

- `data/personalities.ts`

- Refactored `WonderIdentityEngine.ts`

- `data/treeProfiles.ts`

- Refactored `WonderTreeEngine.ts`

- `data/coralDialogues.ts`

- `CoralDialogueEngine.ts`

---

# North Star

WonderLabs should become a content platform rather than a feature platform.

New experiences should be created by adding data.

Not by rewriting engines.