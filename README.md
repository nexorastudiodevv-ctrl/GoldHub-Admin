# لوحة إدارة سهم الذهب

Standalone Firebase-backed administration app for سهم الذهب.

## Local preview

From this directory, start a static web server and open its root URL:

```powershell
python -m http.server 8042
```

The login accepts the administrator account configured in `admin.js`. Firebase Authentication must have email/password sign-in enabled, and the Realtime Database must use the project's administrator-only rules.

The dashboard writes market prices to `market_prices` and manages articles under `articles`; the public سهم الذهب site reads those same database paths.

## Affiliate promotions in articles

When publishing or editing an article, enable **إضافة ترويج لشركة أو مصنع أو محل** to add an optional promotional card. Enter the business name and an HTTP(S) store/referral URL; description, image, and button text are optional. The card is shown at the end of the article on the public site and on its generated SEO page. The affiliate disclosure can be enabled for each promotion.

Promotion start and end dates are optional and use the visitor's local calendar date. The start and end dates are inclusive; the card appears on both dates and hides automatically outside the scheduled range.
