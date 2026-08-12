# Request Flow

``` text
User
  ↓
Next.js UI (app/components)
  ↓
Platform Providers
  ↓
Wonder Platform Services
  ↓
Business Engine
  ↓
Core
  ↓
WonderEventBus
  ↓
Subscribers
  ├─ UI Updates
  ├─ Analytics
  ├─ Worker
  └─ Persistence
```

## Flow

1.  User performs an action.
2.  UI delegates to Platform.
3.  Platform prepares context (DNA/Genome).
4.  Engine executes business rules.
5.  Core publishes domain events.
6.  Subscribers react asynchronously.
