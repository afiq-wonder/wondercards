# Wonder Design System + Wonder Motion System

This package is designed for the current WonderCards Next.js App Router repository that uses root-level `app/`, `components/`, `platform/`, and `types/` folders.

## 1. Copy folders

Copy these folders into the project root:

```text
design/
components/wonder/
```

The final structure should include:

```text
wondercards/
├─ app/
├─ components/
│  ├─ flow/
│  ├─ ui/
│  └─ wonder/
├─ design/
│  └─ tokens/
├─ platform/
└─ public/
   └─ worlds/
      └─ coral/
         └─ host/
```

## 2. Prepare Coral assets

Export individual transparent PNGs from the Coral character sheet and add at least:

```text
public/worlds/coral/host/coral-happy.png
public/worlds/coral/host/coral-curious.png
public/worlds/coral/host/coral-thinking.png
public/worlds/coral/host/coral-celebrate.png
```

Do not use the entire character sheet inside the app. Each expression should be an isolated transparent image with consistent dimensions.

## 3. Test the package

Temporarily replace `components/flow/WelcomeScreen.tsx` with the file in:

```text
examples/WelcomeScreen.example.tsx
```

Then run:

```powershell
npm run dev
```

## 4. Add page transitions

Use `PageTransition` around the active screen. The example is in:

```text
examples/WonderFlow.example.tsx
```

Only add the transition once. If every individual screen already uses `PageTransition`, do not wrap it again in `WonderFlow`.

## 5. Component roles

- `WonderScene`: full-page underwater environment.
- `AmbientLight`: slow moving light rays.
- `BubbleLayer`: reusable ambient bubbles.
- `FloatingParticles`: subtle glowing particles.
- `AnimatedHost`: gentle host floating animation.
- `WonderPanel`: main glass/storybook panel.
- `StoryCard`: parchment-like content card.
- `ProgressDots`: six-stage flow progress.
- `WonderPrimaryButton`: shared premium CTA.
- `PageTransition`: gentle entrance transition.
- `CelebrationEffect`: short sparkle/bubble celebration.

## 6. Reduced-motion accessibility

The CSS automatically disables continuous animation when the device has `prefers-reduced-motion: reduce` enabled.

## 7. Next implementation order

Transform screens one at a time:

```text
Welcome → Story → Wonder Pause → Wonder Mission → Wonder Moment → Celebrate
```

After all six screens use the same system, create the reusable World configuration layer. Avoid building Forest World or Space World before Coral World is visually stable.
