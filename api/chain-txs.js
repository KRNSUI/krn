// api/chain-txs.js
// GET /chain-txs?coinType=<SUI coin type>&limit=200
// Proxies Blockberry (POST /sui/v1/coins/{coinType}/transactions) and returns a compact time series.

export const onRequest = async ({ request, env }) => {
  try {
    const { searchParams } = new URL(request.url);
    const coinType = searchParams.get("coinType");
    const limit = Number(searchParams.get("limit") || 200);

    if (!coinType) return j({ error: "coinType is required" }, 400);
    if (!env.BB_API_KEY) return j({ error: "Missing env.BB_API_KEY" }, 500);

    const url = `https://api.blockberry.one/sui/v1/coins/${encodeURIComponent(coinType)}/transactions`;

    // Blockberry expects POST (per docs). Include limit in JSON body.
    const upstream = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": env.BB_API_KEY,
      },
      body: JSON.stringify({ limit }), // add other filters if you want
      // light edge cache to avoid burst
      cf: { cacheTtl: 30, cacheEverything: false },
    });

    const text = await upstream.text();
    if (!upstream.ok) {
      // pass through upstream status for easier debugging in chart
      return j({ upstreamStatus: upstream.status, error: safe(text) }, 502);
    }

    let list;
    try {
      list = JSON.parse(text);
    } catch {
      return j({ error: "Upstream returned non-JSON", preview: text.slice(0, 200) }, 502);
    }

    // list is expected to be an array of transactions; normalize to time buckets
    const now = Date.now();
    const windowMs = 24 * 60 * 60 * 1000;
    const start = now - windowMs;
    const step = 5 * 60 * 1000; // 5 minutes

    // buckets
    const buckets = [];
    for (let t = Math.floor(start / step) * step; t <= now; t += step) {
      buckets.push({ t, c: 0 });
    }

    // Try multiple timestamp fields seen in various Blockberry responses
    // (adjust if docs guarantee one name)
    for (const tx of Array.isArray(list) ? list : []) {
      // Common candidates: timestampMs, timestamp, time, createdAt, blockTimeMs
      const tsRaw =
        tx.timestampMs ?? tx.timestamp_ms ?? tx.timestamp ??
        tx.time ?? tx.createdAt ?? tx.blockTimeMs ?? null;

      let ts = null;
      if (typeof tsRaw === "number") ts = tsRaw;
      else if (typeof tsRaw === "string") {
        // try parse string numbers or ISO
        ts = /^\d+$/.test(tsRaw) ? Number(tsRaw) : Date.parse(tsRaw);
      }

      if (!ts || Number.isNaN(ts)) continue;
      if (ts < start || ts > now) continue;
      const idx = Math.floor((ts - start) / step);
      if (buckets[idx]) buckets[idx].c += 1;
    }

    return j(
      { coinType, stepMs: step, start, now, points: buckets },
      200,
      { "cache-control": "s-maxage=30" }
    );
  } catch (err) {
    return j({ error: String(err) }, 500);
  }
};

function j(obj, status = 200, headers = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}

function safe(s) {
  return (s || "").slice(0, 500);
}
