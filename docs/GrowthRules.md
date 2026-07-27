# Growth Rules

Version 1.0

---

# What are Growth Rules?

Growth Rules define how meaningful family experiences contribute to Wonder DNA.

They are the bridge between real-world adventures and emotional growth.

WonderGrowthEngine never decides how much a family grows.

It simply follows the Growth Rules.

This keeps the engine clean, predictable and easy to evolve.

---

# Philosophy

Growth should come from experiences.

Not from points.

Not from grinding.

Not from repetition.

Every Wonder Moment may strengthen one or many Growth Traits depending on what happened during the adventure.

Growth Rules describe that relationship.

---

# Why Growth Rules Exist

Without Growth Rules, the engine would contain hard-coded logic.

Example:

```ts

if (tag === "creative") {

    creativity += 20;

}

```

As WonderLabs grows, this becomes difficult to maintain.

Instead, every activity should reference a central Growth Rule.

This separates game balance from engine logic.

---

# Architecture

```

Wonder Moment

↓

WonderGrowthEngine

↓

Growth Rules

↓

Wonder DNA

↓

Wonder Tree

↓

Coral Dialogue

```

The engine executes.

The rules decide.

---

# Rule Structure

Every Growth Rule defines:

- Activity

- Traits affected

- XP contribution

- Optional milestone triggers

- Optional dialogue hints

Example:

```

Drawing Coral

↓

Creativity +15

↓

Imagination +10

↓

Curiosity +5

```

---

# Example Rules

## Drawing

```

Creativity +15

Imagination +10

Curiosity +5

```

---

## Building Together

```

Creativity +10

Exploration +10

Kindness +5

```

---

## Helping Mum

```

Kindness +20

Gratitude +15

Resilience +5

```

---

## Helping Dad

```

Kindness +20

Gratitude +15

Bravery +5

```

---

## Exploring Nature

```

Exploration +20

Curiosity +15

Gratitude +5

```

---

## Reading Together

```

Curiosity +15

Imagination +15

Resilience +5

```

---

## Completing a Challenge

```

Bravery +15

Resilience +15

Confidence +10 (future)

```

---

## Sharing Toys

```

Kindness +15

Gratitude +10

Relationship +5 (future)

```

---

# Multiple Traits

A single activity should rarely improve only one trait.

Real experiences are multidimensional.

For example:

```

Making a Paper Boat

↓

Creativity

↓

Curiosity

↓

Imagination

↓

Exploration

```

WonderLabs celebrates the richness of an experience rather than reducing it to a single score.

---

# Weighting

Growth Rules may assign different weights to different traits.

Example:

```

Helping a Friend

Kindness      +20

Gratitude     +15

Resilience    +5

```

The primary behaviour receives the largest contribution.

Supporting behaviours receive smaller contributions.

---

# Future Expansion

Growth Rules should eventually support:

- Difficulty modifiers

- Age adjustments

- Seasonal events

- Family traditions

- Long-term quests

- Wonder Village activities

- Physical Wonder Cards

- Community events

The engine should not change when these are added.

Only the rules evolve.

---

# Benefits

Growth Rules provide:

- Cleaner engines

- Easier balancing

- Better scalability

- More consistent growth

- Faster content creation

Designers can adjust progression without changing engine code.

Developers can improve the engine without affecting game balance.

---

# Design Principles

Growth Rules should always:

- Encourage curiosity

- Reward kindness

- Celebrate creativity

- Support resilience

- Strengthen family relationships

Growth Rules should never:

- Encourage unhealthy competition

- Reward excessive screen time

- Punish failure

- Promote repetitive grinding

---

# Future Location

```

data/

    growthRules.ts

```

The WonderGrowthEngine reads Growth Rules.

It never contains balancing values directly.

This keeps WonderLabs flexible for years to come.

---

# Our North Star

The engine powers growth.

The rules shape growth.

Families experience growth.

WonderLabs simply helps make that growth visible.