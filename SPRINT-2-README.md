# WonderCards Sprint 2 — Full Platform Integration

This package migrates WonderCards from a screen-only prototype to a platform-driven application.

## Implemented flow

```text
WelcomeScreen
  → WonderPlatform.startCycle()
  → WonderGenome generated
  → StoryScreen
  → WonderPauseScreen
  → WonderMissionScreen
  → WonderMomentScreen
  → WonderPlatform.completeCycle()
  → WonderMoment saved
  → Growth calculated
  → WonderDNA updated
  → CelebrateScreen
```

## Fixed

The former runtime failure:

```text
onSave is not a function
```

is removed. `WonderMomentScreen` now calls the typed `completeAdventure()` context method, which delegates to `WonderPlatform.completeCycle()`.

## Architecture

```text
WonderCards UI
  ↓
PlatformProvider
  ↓
WonderCycleProvider
  ↓
Wonder Platform facade
  ↓
WonderCycleService
  ↓
Browser repositories
```

Presentation navigation remains UI state. Business lifecycle, memory, growth and DNA updates live inside the platform.

## Installation

1. Back up the current WonderCards repository.
2. Copy this package's `src` directory into the project.
3. Resolve any intentional local differences in existing files.
4. Ensure the project supports the `@/*` alias.
5. Start the app:

```bash
npm run dev
```

## Tailwind

The included `globals.css` uses Tailwind CSS v4:

```css
@import "tailwindcss";
```

For Tailwind v3, replace that line with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## Optional tests

Install Vitest if it is not already present:

```bash
npm install -D vitest jsdom
```

Add this script:

```json
{
  "scripts": {
    "test": "vitest run"
  }
}
```

Then run:

```bash
npm test
```

## Persistence

Sprint 2 uses `localStorage` adapters so WonderDNA and Wonder Moments persist across browser refreshes on the same device.

This is not yet multi-device cloud sync. That belongs to the Sync sprint.

## Production note

The demo family ID is:

```text
family-demo
```

Replace it with the authenticated family ID once Identity Service is implemented.
