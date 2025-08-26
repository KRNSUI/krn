// /functions/stars/toggle.js
export async function onRequestPost({ request, env }) {
  try {
    if (!env.KRN_DB) {
      return json({ ok: false, error: "KRN_DB binding missing" }, 500);
    }

    // Body: { id: string, dir: "up" | "down", demo?: boolean }
    const { id, dir /*, demo */ } = await request.json().catch(() => ({}));
    if (!id || !["up", "down"].includes(dir)) {
      return json({ ok: false, error: "bad input" }, 400);
    }

    // Ensure the table exists (no-op after first time)
    await env.KRN_DB.prepare(`
      CREATE TABLE IF NOT EXISTS star_counts (
        id TEXT PRIMARY KEY,
        count INTEGER NOT NULL DEFAULT 0
      )
    `).run();

    // +1 for "up", -1 for "down"; never let it go below 0
    const delta = dir === "up" ? 1 : -1;

    await env.KRN_DB.batch([
      env.KRN_DB.prepare(
        "INSERT OR IGNORE INTO star_counts (id, count) VALUES (?, 0)"
      ).bind(id),
      env.KRN_DB.prepare(
        "UPDATE star_counts SET count = MAX(count + ?, 0) WHERE id = ?"
      ).bind(delta, id),
    ]);

    const row = await env.KRN_DB
      .prepare("SELECT count FROM star_counts WHERE id = ?")
      .bind(id)
      .first();

    return json({ ok: true, count: row?.count ?? 0 });
  } catch (err) {
    console.error("star toggle error:", err);
    return json({ ok: false, error: "server error" }, 500);
  }
}

/* ---------- helpers ---------- */
function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
