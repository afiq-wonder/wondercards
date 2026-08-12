# Deployment Architecture

``` text
Browser
   │
Next.js App
   │
Platform
   │
──────────────
Core
Engine
──────────────
   │
Server
Worker
Studio
SDK
   │
Runtime State
 ├─ wonder-factory
 ├─ wonder-scheduler
 └─ wonder-studio
```

## Runtime

-   Server: APIs
-   Worker: background jobs
-   Studio: content pipeline
-   Runtime folders store generated state only.
