# WonderOS Developer Portal — Install

This integrates into the existing Next.js App Router project and reads every
`.md` / `.mdx` file inside the repository root `docs/` automatically.

## Copy
Extract this ZIP into the WonderCards repository root and allow folders to merge.
It adds `app/docs`, `app/api/docs/search`, `components/docs`, `lib/docs`, a validation
script, and a GitHub Actions workflow. It does not replace the existing homepage.

## Dependencies

```powershell
npm install react-markdown remark-gfm rehype-slug rehype-autolink-headings mermaid gray-matter
```

Add this script inside the existing `package.json` → `scripts` object:

```json
"docs:validate": "node scripts/validate-docs.mjs"
```

Run:

```powershell
npm run docs:validate
npm run dev
```

Open: `http://localhost:3000/docs`

## Optional front matter

```yaml
---
title: Platform Specification
description: WonderOS platform contracts.
status: accepted
order: 20
tags: [platform, architecture]
---
```

## Mermaid

Use a fenced block with the language `mermaid`; the portal renders it automatically.
