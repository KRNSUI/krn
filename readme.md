# KRN — Anonymous Complaints (Cloudflare Pages + D1)

## What this is
- Static HTML site with a form.
- A single Pages Function (`/functions/submit.js`) stores submissions in **Cloudflare D1**.
- No IPs, no UAs, no cookies — aims for practical anonymity.

## Quick deploy (Cloudflare Pages UI)
1. Push this folder to a **public GitHub repo**.
2. In Cloudflare Dashboard → **Pages** → **Create a project** → **Connect to Git** and select your repo.
3. **Build settings**:
   - Framework preset: **None**
   - Build command: _empty_
   - Build output directory: `/` (root) or leave blank; Pages will publish static files directly.
4. After first build, go to your Pages project:
   - **Settings → Functions**:
     - Ensure “Functions” is **enabled**.
     - Under **D1 Databases**, click **Add binding**:
       - Binding name: `KRN_DB`
       - Database: create or select one (e.g., `krn-db`).
5. Initialize the database:
   - D1 → your `krn-db` → **Query** → paste the contents of `schema.sql` → **Run**.

That’s it. Visit the site and submit a test complaint.

## Local dev (optional)
If you want to test locally:
1. Install `wrangler` (optional): https://developers.cloudflare.com/workers/wrangler/install-and-update/
2. Create a local D1 DB:
   ```bash
   wrangler d1 create krn-db
   wrangler d1 execute krn-db --file=schema.sql
