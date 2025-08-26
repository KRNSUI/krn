// /functions/stars/user.js
export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    const ids = (url.searchParams.get("ids") || "")
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);
    const addr = url.searchParams.get("addr");

    if (!ids.length || !addr) {
      return new Response(JSON.stringify({ starred: {} }), {
        headers: { "content-type": "application/json" }
      });
    }

    // Build placeholders (?, ?, ?)
    const qs = ids.map(() => "?").join(",");
    const res = await env.KRN_DB
      .prepare(`SELECT post_id FROM stars WHERE post_id IN (${qs}) AND addr = ?`)
      .bind(...ids, addr)
      .all();

    const starred = {};
    for (const row of res.results || []) {
      starred[String(row.post_id)] = true;
    }

    return new Response(JSON.stringify({ starred }), {
      headers: { "content-type": "application/json" }
    });
  } catch (e) {
    console.error("stars/user error:", e);
    return new Response(JSON.stringify({ starred: {} }), {
      headers: { "content-type": "application/json" }, status: 200
    });
  }
}
