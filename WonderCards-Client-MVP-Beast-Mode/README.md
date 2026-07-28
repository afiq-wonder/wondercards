# WonderCards Client MVP — Beast Mode

A production-quality first client vertical slice for the existing WonderCards project.

## What this build delivers

- Family name input
- Eight selectable Wonder Worlds
- Age and duration controls
- Responsive storybook landing experience
- Real Next.js route handler at `POST /api/adventures`
- Strong server-side request validation
- Request IDs and structured API errors
- JSON-safe WonderCard transport and Date hydration
- Abortable browser requests
- Loading/cancellation experience
- Existing WonderFlow launch after generation
- Uses the current WonderDNAEngine and WonderCardBuilder as the generation core

This is deliberately a synchronous application-facing generation API. It gives the family a working client now. The internal implementation can later be replaced by WonderOS job submission without rewriting the UI contract.

## Install — exact file copy, no regex patching

Extract this folder inside the root of `wondercards`.

Run these commands from the project root:

```powershell
New-Item -ItemType Directory -Force .\app\api\adventures | Out-Null
New-Item -ItemType Directory -Force .\components\create | Out-Null
New-Item -ItemType Directory -Force .\lib | Out-Null

Copy-Item .\WonderCards-Client-MVP-Beast-Mode\app\api\adventures\route.ts .\app\api\adventures\route.ts -Force
Copy-Item .\WonderCards-Client-MVP-Beast-Mode\components\create\AdventureCreator.tsx .\components\create\AdventureCreator.tsx -Force
Copy-Item .\WonderCards-Client-MVP-Beast-Mode\components\create\AdventurePreparing.tsx .\components\create\AdventurePreparing.tsx -Force
Copy-Item .\WonderCards-Client-MVP-Beast-Mode\components\WonderApp.tsx .\components\WonderApp.tsx -Force
Copy-Item .\WonderCards-Client-MVP-Beast-Mode\lib\wonderAdventureClient.ts .\lib\wonderAdventureClient.ts -Force
Copy-Item .\WonderCards-Client-MVP-Beast-Mode\types\adventureGeneration.ts .\types\adventureGeneration.ts -Force
Get-Content .\WonderCards-Client-MVP-Beast-Mode\app\wonder-client.css | Add-Content .\app\globals.css
```

Then verify:

```powershell
npx.cmd tsc --noEmit
npm.cmd run dev
```

Open the local URL shown by Next.js and click:

```text
✨ Create Today’s Adventure
```

## Expected flow

```text
Creator screen
  → POST /api/adventures
  → WonderDNAEngine
  → WonderCardBuilder
  → JSON transport
  → Date hydration
  → WonderFlow
  → Story / Mission / Pause / Moment / Celebrate
```

## Verified

The included TypeScript files were inserted into the provided project source and passed:

```text
npx tsc --noEmit
```

A full Next.js production build could not be completed in the build environment because the Next.js native SWC package download returned HTTP 503. This was an environment download failure, not a TypeScript failure.
