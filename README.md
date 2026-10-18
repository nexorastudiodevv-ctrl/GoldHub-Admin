# GoldHub Admin

Standalone Firebase-backed administration app for GoldHub.

## Local preview

From this directory, start a static web server and open its root URL:

```powershell
python -m http.server 8042
```

The login accepts the administrator account configured in `admin.js`. Firebase Authentication must have email/password sign-in enabled, and the Realtime Database must use the project's administrator-only rules.

The dashboard writes market prices to `market_prices` and manages articles under `articles`; the public GoldHub site reads those same database paths.
