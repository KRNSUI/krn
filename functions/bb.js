// functions/bb.js
export async function onRequest({ request, env }) {
  try {
    if (!env.BB_API_KEY) {
      return json({ ok: false, error: "Missing BB_API_KEY binding" }, 500);
    }

    // config
    const coinType =
      "0x278c12e3bcc279248ea3e316ca837244c3941399f2bf4598638f4a8be35c09aa::krn::KRN";

    const urlIn = new URL(request.url);
    const hours = parseInt(urlIn.searchParams.get("hours") || "24", 10);
    const size = Math.max(50, Math.min(500, hours * 20)); // ~20 tx/hour heuristic
    const page = 1;

    // Correct Blockberry endpoint (POST)
    // Docs: getTransactionsByCoinType → POST /sui/v1/coins/{coinType}/transactions
    const url = `https://api.blockberry.one/sui/v1/coins/${encodeURIComponent(coinType)}/transactions`;

    const upstream = await fetch(url, {
      method: "POST",
      headers: {
        "accept": "application/json",
        "content-type": "application/json",
        "x-api-key": env.BB_API_KEY,
      },
      // Some Blockberry endpoints expect pagination in the body
      body: JSON.stringify({ page, size }),
    });

    const text = await upstream.text();
    if (!upstream.ok) {
      // surface upstream details to your canvas error
      return json(
        { ok: false, error: `Upstream ${upstream.status}`, details: text.slice(0, 400) },
        upstream.status
      );
    }

    let raw;
    try { raw = JSON.parse(text); }
    catch { return json({ ok: false, error: "Non-JSON response", preview: text.slice(0, 160) }, 502); }

    // Accept common shapes: {data:[...]}, {list:[...]}, or [...]
    const items = Array.isArray(raw?.data)
      ? raw.data
      : Array.isArray(raw?.list)
      ? raw.list
      : Array.isArray(raw)
      ? raw
      : [];

    const cutoff = Date.now() - hours * 3600 * 1000;

    // Bucket by hour
    const buckets = new Map(); // hourStartMs -> count
    for (const it of items) {
      const ts = pickTimestampMs(it);
      if (!ts || ts < cutoff) continue;
      const hourStart = Math.floor(ts / 3600000) * 3600000;
      buckets.set(hourStart, (buckets.get(hourStart) || 0) + 1);
    }

    // Build continuous hourly series; ISO labels work well with your chart code
    const labels = [];
    const series = [];
    const start = Math.floor(cutoff / 3600000) * 3600000;
    for (let t = start; t <= Date.now(); t += 3600000) {
      labels.push(new Date(t).toISOString());
      series.push(buckets.get(t) || 0);
    }

    if (urlIn.searchParams.get("debug") === "1") {
      return json({ ok: true, labels, series, sample: preview(items.slice(0, 3)) });
    }

    return json({ ok: true, labels, series });
  } catch (err) {
    return json({ ok: false, error: String(err) }, 500);
  }
}

/* ---------- helpers ---------- */

function pickTimestampMs(it) {
  // Try several possible fields; convert seconds → ms if needed
  const candidates = [
    it.timestampMs, it.timestamp_ms, it.checkpointTimestampMs, it.executedTimeMs,
    it.timestamp, it.time, it.createdAt, it.created_at
  ];
  for (const v of candidates) {
    if (v == null) continue;
    if (typeof v === "number") return v > 1e12 ? v : v * 1000;
    if (typeof v === "string") {
      const num = Number(v);
      if (Number.isFinite(num)) return num > 1e12 ? num : num * 1000;
      const iso = Date.parse(v);
      if (!Number.isNaN(iso)) return iso;
    }
  }
  return null;
}

function preview(obj) {
  try {
    return JSON.parse(JSON.stringify(obj, (_k, v) => (typeof v === "string" && v.length > 120 ? v.slice(0, 120) + "…" : v)));
  } catch { return obj; }
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
