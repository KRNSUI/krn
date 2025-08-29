// api/diag.js
// GET /diag[?quick=1]
export const onRequest = async ({ request, env }) => {
  const url = new URL(request.url);
  const quick = url.searchParams.get("quick") === "1";

  const out = {
    ok: true,
    hasKrnDbBinding: !!env.KRN_DB,
    hasBBApiKey: !!env.BB_API_KEY,
  };

  try {
    if (!env.KRN_DB) {
      out.ok = false;
      out.error = "KRN_DB binding missing";
      return json(out, 500);
    }

    // quick mode: just bindings
    if (quick) return json(out);

    // deeper DB checks (safe, optional)
    const tables = await env.KRN_DB
      .prepare("SELECT name FROM sqlite_master WHERE type='table'")
      .all();
    out.tables = (tables.results || []).map(r => r.name);

    // complaints count (if table exists)
    if (out.tables.includes("complaints")) {
      const cnt = await env.KRN_DB
        .prepare("SELECT COUNT(*) AS n FROM complaints")
        .all();
      out.complaintsCount = cnt.results?.[0]?.n ?? 0;
    } else {
      out.complaintsCount = 0;
      out.note = "complaints table not found";
    }

    return json(out);
  } catch (e) {
    out.ok = false;
    out.error = String(e);
    return json(out, 500);
  }
};

function json(obj, status = 200, headers = {}) {
  return new Response(JSON.stringify(obj, null, 2), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}
