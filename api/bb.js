// api/bb.js
export async function onRequest({ request, env }) {
  const coinType =
    "0x278c12e3bcc279248ea3e316ca837244c3941399f2bf4598638f4a8be35c09aa::krn::KRN";

  if (!env.BB_API_KEY) {
    return json({ ok: false, error: "Missing BB_API_KEY binding" }, 500);
  }

  const urlIn = new URL(request.url);
  const hours = clampInt(urlIn.searchParams.get("hours"), 24, 1, 72); // default 24h, 1..72
  const pageSize = clampInt(urlIn.searchParams.get("size"), 10, 1, 50); // holders page size

  const headers = {
    accept: "application/json",
    "content-type": "application/json",
    "x-api-key": env.BB_API_KEY,
  };

  // small helpers
  const getJSON = async (path) => {
    const url = `https://api.blockberry.one/sui/v1${path}`;
    const r = await fetch(url, { headers, method: "GET" });
    const text = await r.text();
    if (!r.ok) throw new Error(`${path} → ${r.status}: ${truncate(text, 240)}`);
    return JSON.parse(text || "{}");
  };

  const postJSON = async (path, bodyObj) => {
    const url = `https://api.blockberry.one/sui/v1${path}`;
    const r = await fetch(url, {
      headers,
      method: "POST",
      body: JSON.stringify(bodyObj || {}),
    });
    const text = await r.text();
    if (!r.ok) throw new Error(`${path} → ${r.status}: ${truncate(text, 240)}`);
    return JSON.parse(text || "{}");
  };

  try {
    // 1) Core coin info (includes total supply + decimals/symbol)
    const supply = await getJSON(`/coins/${encodeURIComponent(coinType)}`);

    // 2) Coin metadata (name/logo/etc.)
    const metadata = await getJSON(
      `/coins/metadata/${encodeURIComponent(coinType)}`
    ).catch(() => null); // metadata may not always exist

    // 3) Top holders
    const holders = await getJSON(
      `/coins/${encodeURIComponent(
        coinType
      )}/holders?page=0&size=${pageSize}&orderBy=DESC&sortBy=AMOUNT`
    ).catch(() => ({ data: [] }));

    // 4) Transactions (POST) → bucket to counts per hour (used for chart)
    let labels = [];
    let series = [];
    let txWarning = null;

    try {
      const limit = Math.max(50, Math.min(500, hours * 20)); // heuristic ~20 tx/hour
      // Primary: POST /coins/{coinType}/transactions
      let tx = await postJSON(
        `/coins/${encodeURIComponent(coinType)}/transactions`,
        { page: 0, size: limit }
      ).catch(async (e) => {
        // Fallback path (if provider changes route shape)
        // POST /transactions/by-coin-type?coinType=...
        try {
          const fb = await postJSON(
            `/transactions/by-coin-type?coinType=${encodeURIComponent(coinType)}&page=0&size=${limit}`,
            {}
          );
          return fb;
        } catch {
          throw e;
        }
      });

      // normalize item array out of common shapes
      const items = normalizeList(tx);
      const cutoff = Date.now() - hours * 3600 * 1000;
      const buckets = new Map();

      for (const it of items) {
        const ts = pickTimestampMs(it);
        if (!ts || ts < cutoff) continue;
        const hourStart = Math.floor(ts / 3600000) * 3600000;
        buckets.set(hourStart, (buckets.get(hourStart) || 0) + 1);
      }
      const start = Math.floor(cutoff / 3600000) * 3600000;
      for (let t = start; t <= Date.now(); t += 3600000) {
        labels.push(new Date(t).toISOString());
        series.push(buckets.get(t) || 0);
      }
    } catch (e) {
      txWarning = String(e.message || e);
      labels = [];
      series = [];
    }

    return json({
      ok: true,
      coin: {
        // normalize a few friendly fields for UI
        symbol: metadata?.symbol ?? supply?.symbol ?? "KRN",
        name: metadata?.name ?? "KRN",
        decimals: supply?.decimals ?? 9,
        totalSupply: supply?.total, // may be number or string per provider
        metadata,
      },
      topHolders: normalizeList(holders),
      priceSeries: { labels, series }, // actually tx/hour series (rename in UI as needed)
      warnings: txWarning ? { txWarning } : undefined,
    });
  } catch (err) {
    return json({ ok: false, error: String(err) }, 500);
  }
}

/* ---------------- helpers ---------------- */

function clampInt(v, def, min, max) {
  const n = parseInt(v ?? def, 10);
  if (Number.isNaN(n)) return def;
  return Math.max(min, Math.min(max, n));
}

function normalizeList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.list)) return payload.list;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
}

function pickTimestampMs(it) {
  const cands = [
    it.timestamp,
    it.time,
    it.createdAt,
    it.created_at,
    it.timestampMs,
    it.checkpointTimestampMs,
    it.executedTimeMs,
  ];
  for (const v of cands) {
    if (v == null) continue;
    if (typeof v === "string") {
      const iso = Date.parse(v);
      if (!Number.isNaN(iso)) return iso;
      const num = Number(v);
      if (Number.isFinite(num)) return num > 1e12 ? num : num * 1000;
    } else if (typeof v === "number" && Number.isFinite(v)) {
      return v > 1e12 ? v : v * 1000;
    }
  }
  return null;
}

function truncate(s, n) {
  return s.length > n ? s.slice(0, n) + "…" : s;
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
