export async function onRequest({ env }) {
  const out = { hasBinding: !!env.KRN_DB };
  try {
    if (!env.KRN_DB) throw new Error("KRN_DB binding missing");
    const t = await env.KRN_DB.prepare(
      "SELECT name FROM sqlite_master WHERE type='table'"
    ).all();
    out.tables = (t.results || []).map(x => x.name);
    const c = await env.KRN_DB.prepare(
      "SELECT COUNT(*) AS n FROM complaints"
    ).all();
    out.complaintsCount = c.results?.[0]?.n ?? 0;
    return new Response(JSON.stringify(out, null, 2), {
      headers: { "content-type": "application/json" }
    });
  } catch (e) {
    out.error = String(e);
    return new Response(JSON.stringify(out, null, 2), {
      status: 500, headers: { "content-type": "application/json" }
    });
  }
}
export const onRequest = async ({ env }) => {
  const hasKey = !!env.BB_API_KEY;
  return new Response(JSON.stringify({ ok: true, hasBBApiKey: hasKey }), {
    headers: { "content-type": "application/json" },
  });
};