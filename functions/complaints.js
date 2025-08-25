// functions/complaints.js
export async function onRequestGet({ request, env }) {
  try {
    if (!env.KRN_DB) throw new Error("KRN_DB binding missing");

    const url = new URL(request.url);

    // --- single item reveal: /complaints?id=...&reveal=1 ---
    const id = url.searchParams.get("id");
    const reveal = url.searchParams.get("reveal");
    if (id && reveal) {
      const row = await env.KRN_DB
        .prepare(
          `SELECT id, message, created_at
             FROM complaints
            WHERE id = ?`
        )
        .bind(id)
        .first();

      return json({
        ok: true,
        complaint: row || null,
      });
    }

    // --- list endpoint with limit + before cursor ---
    const limit = clampInt(url.searchParams.get("limit"), 50, 1, 200); // default 50, max 200
    const before = url.searchParams.get("before"); // ISO string or millis

    let sql = `SELECT id, message, created_at
                 FROM complaints `;
    const bind = [];

    if (before) {
      // Accept both ISO and numeric ms
      let beforeVal = before;
      if (/^\d+$/.test(before)) {
        // milliseconds
        beforeVal = new Date(Number(before)).toISOString();
      }
      sql += `WHERE datetime(created_at) < datetime(?) `;
      bind.push(beforeVal);
    }

    sql += `ORDER BY datetime(created_at) DESC
            LIMIT ?`;
    bind.push(limit);

    const r = await env.KRN_DB.prepare(sql).bind(...bind).all();

    // Return an array (keeps compatibility with your current feed.js)
    return new Response(JSON.stringify(r.results || []), {
      headers: { "content-type": "application/json" },
    });
  } catch (e) {
    console.error("complaints error:", e);
    return new Response("Server error", { status: 500 });
  }
}

/* ---------------- helpers ---------------- */
function clampInt(v, def, min, max) {
  const n = parseInt(v ?? def, 10);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : def;
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
