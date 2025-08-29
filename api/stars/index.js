export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    const ids = (url.searchParams.get("ids") || "")
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);

    if (!ids.length) {
      return new Response(JSON.stringify({ counts: {} }), {
        headers: { "content-type": "application/json" }
      });
    }

    // Build placeholders (?, ?, ?)
    const qs = ids.map(() => "?").join(",");
    const res = await env.KRN_DB
      .prepare(`SELECT post_id, COUNT(*) AS c FROM stars WHERE post_id IN (${qs}) GROUP BY post_id`)
      .bind(...ids)
      .all();

    const counts = {};
    for (const row of res.results || []) counts[String(row.post_id)] = Number(row.c || 0);

    return new Response(JSON.stringify({ counts }), {
      headers: { "content-type": "application/json" }
    });
  } catch (e) {
    console.error("stars/index error:", e);
    return new Response(JSON.stringify({ counts: {} }), {
      headers: { "content-type": "application/json" }, status: 200
    });
  }
}
