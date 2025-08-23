// GET /chain-txs?coinType=<SUI coin type>&limit=200
// Returns a compact time-series of tx counts by 5-minute buckets for the last ~24h.

export const onRequest = async ({ request, env }) => {
  try {
    const { searchParams } = new URL(request.url);
    const coinType = searchParams.get("coinType");
    const limit = searchParams.get("limit") || "200"; // tune as needed

    if (!coinType) {
      return json({ error: "coinType is required" }, 400);
    }
    if (!env.BB_API_KEY) {
      return json({ error: "Missing BB_API_KEY secret" }, 500);
    }

    // Blockberry Sui: transactions by coin type (adjust path if their docs change)
    const upstream = `https://api.blockberry.one/sui/v1/transactions/coin-type?coinType=${encodeURIComponent(
      coinType
    )}&limit=${encodeURIComponent(limit)}`;

    const res = await fetch(upstream, {
      headers: { "x-api-key": env.BB_API_KEY },
      // Add small cache on the edge to avoid hammering
      cf: { cacheTtl: 30, cacheEverything: false },
    });

    if (!res.ok) {
      const text = await res.text();
      return json({ upstreamStatus: res.status, error: text }, 502);
    }

    const list = await res.json(); // Expecting an array of txs with timestamps

    // Normalize into 5-minute buckets over ~24h
    const now = Date.now();
    const windowMs = 24 * 60 * 60 * 1000;
    const start = now - windowMs;
    const step = 5 * 60 * 1000; // 5 minutes

    // Build empty buckets
    const buckets = [];
    for (let t = Math.floor(start / step) * step; t <= now; t += step) {
      buckets.push({ t, c: 0 });
    }

    // Try to read timestamps; adjust field names if Blockberry responds differently
    for (const tx of list || []) {
      const ts =
        Number(tx.timestamp_ms ?? tx.timestamp ?? tx.time ?? 0); // try common fields
      if (!ts) continue;
      if (ts < start || ts > now) continue;
      const idx = Math.floor((ts - start) / step);
      if (buckets[idx]) buckets[idx].c += 1;
    }

    return json(
      {
        coinType,
        stepMs: step,
        start,
        now,
        points: buckets, // [{t, c}]
      },
      200,
      {
        "cache-control": "s-maxage=30", // 30s edge cache
      }
    );
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
};

function json(obj, status = 200, headers = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}
