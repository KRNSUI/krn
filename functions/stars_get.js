export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const id = url.searchParams.get("complaint");
  if (!id) return new Response(JSON.stringify({ count: 0, you: false }), { headers:{ "content-type":"application/json" } });

  const addr = (url.searchParams.get("addr") || "").toLowerCase();

  const countRow = await env.KRN_DB.prepare(
    "SELECT COUNT(*) AS cnt FROM stars WHERE complaint_id = ?"
  ).bind(id).first();

  let you = false;
  if (addr) {
    const y = await env.KRN_DB.prepare(
      "SELECT 1 FROM stars WHERE complaint_id = ? AND lower(addr) = ? LIMIT 1"
    ).bind(id, addr).first();
    you = !!y;
  }

  return new Response(JSON.stringify({ count: Number(countRow?.cnt || 0), you }), {
    headers: { "content-type": "application/json" }
  });
}
