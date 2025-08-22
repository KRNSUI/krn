Perfect. Since you now have two repos (`krn` = Pages frontend + functions, `krnsui` = worker scaffolding that is no longer needed), the README for **`krn`** should explain:

* What the project is (anonymous complaint board on Sui, Cloudflare Pages + D1).
* How to run locally.
* How to deploy.
* Database schema & migrations.
* Security considerations (CSP, no PII).

Here’s a clean draft tailored to what you’ve given me:

---

# KRN – Anonymous Complaints on Sui

An anonymous complaint board powered by **Cloudflare Pages Functions** + **Cloudflare D1**.
No names, no emails, no tracking.

👉 Live: [krn.fuck-out.com](https://krn.fuck-out.com)

---

## Features

* Static frontend with complaint submission form.
* Pages Functions (`/functions`) handle API requests:

  * `submit.js` → insert complaint into D1.
  * `complaints.js` → list recent complaints.
  * `diag.js` + `status.js` → runtime health checks.
* Cloudflare D1 database with `complaints` table and indexed timestamps.
* Strict CSP for security.

---

## Project Structure

```
krn/
├── public/           # static assets (feed.js, styles.css, etc.)
├── functions/        # Pages Functions (API routes)
│   ├── submit.js
│   ├── complaints.js
│   ├── diag.js
│   └── status.js
├── migrations/       # D1 schema migrations
│   └── 001_init.sql
├── index.ts          # entry point / renderHtml
├── renderHtml.ts     # HTML response helper
└── wrangler.toml     # Cloudflare config (bindings etc.)
```

---

## Database

Table schema (`migrations/001_init.sql`):

```sql
CREATE TABLE IF NOT EXISTS complaints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_complaints_created_at
  ON complaints(created_at);
```

---

## Local Development

Requires [Wrangler](https://developers.cloudflare.com/workers/wrangler/).

```bash
# Install dependencies if any
npm install

# Run locally with Pages + Functions
npx wrangler pages dev ./public --local
```

---

## Deployment

1. Push to `main`.
2. Cloudflare Pages (`krn`) auto-builds + deploys.
3. Ensure D1 binding is configured:

   * Go to **Pages → Settings → Functions → Bindings**
   * Add binding:

     * Type: D1 Database
     * Variable: `KRN_DB`
     * Database: `krn`

---

## Endpoints

* `/submit` → POST JSON `{ "message": "..." }`
* `/complaints` → GET latest complaints
* `/diag` → reports whether `KRN_DB` binding is available
* `/status` → database health check

---

## Security

* Strong CSP enforced (`script-src 'self'`).
* No personal identifiers allowed.
* All data stored anonymously in D1.

---

## License

MIT License.

---

Do you want me to also draft a **short README for the `krnsui` repo** (to mark it archived/unused), so nobody confuses it with the real project?
