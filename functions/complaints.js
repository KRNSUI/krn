export async function onRequestGet({ env }) {
  try {
    if (!env.KRN_DB) throw new Error("KRN_DB binding missing");
    const rows = await env.KRN_DB.prepare(
      `SELECT id, message, created_at
         FROM complaints
        ORDER BY datetime(created_at) DESC
        LIMIT 50`
    ).all();
    return new Response(JSON.stringify(rows.results || []), {
      headers: { "content-type": "application/json" }
    });
  } catch (e) {
    console.error("complaints error:", e);
    return new Response("Server error", { status: 500 });
  }
}
