// functions/bb.js
export async function onRequest({ request, env }) {
  try {
    if (!env.BB_API_KEY) {
      return json({ ok: false, error: "Missing BB_API_KEY binding" }, 500);
    }

    // --- config ---
    const coinType =
      "0x278c12e3bcc279248ea3e316ca837244c3941399f2bf4598638f4a8be35c09aa::krn::KRN";

    const urlIn = new URL(request.url);
    const hours = parseInt(urlIn.searchParams.get("hours") || "24", 10);
    const limit = Math.max(50, Math.min(500, hours * 20)); // ~20 tx/hour heuristic

    // Use the documented endpoint: GET /sui/v1/transactions/by-coin-type
    const url = new URL("https://api.blockberry.one/sui/v1/transactions/by-coin-type");
    url.searchParams.set("network", "mainnet");
    url.searchParams.set("coinType", coinType);
    url.searchParams.set("page", "1");
    url.searchParams.set("size", String(limit));

    const res = await fetch(url, {
      headers: {
        accept: "application/json",
        "x-api-key": env.BB_API_KEY,
      },
    });

    const text = await res.text();
    if (!res.ok) {
      return json(
        { ok: false, error: `Upstream ${res.status}`, details: text.slice(0, 300) },
        res.status
      );
    }

    const raw = JSON.parse(text);

    // Normalize items from common shapes: {data: [...]}, {list: [...]}, or [...]
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

    // Build continuous hourly series (ISO labels so your chart code can format)
    const labels = [];
    const series = [];
    const start = Math.floor(cutoff / 3600000) * 3600000;
    for (let t = start; t <= Date.now(); t += 3600000) {
      labels.push(new Date(t).toISOString());
      series.push(buckets.get(t) || 0);
    }

    if (urlIn.searchParams.get("debug") === "1") {
      return json({ ok: true, labels, series, rawPreview: preview(raw) });
    }

    return json({ ok: true, labels, series });
  } catch (err) {
    return json({ ok: false, error: String(err) }, 500);
  }
}

/* ---------------- helpers ---------------- */

function pickTimestampMs(it) {
  // Try several possible fields; convert seconds -> ms if needed
  const candidates = [
    it.timestamp,
    it.timestampMs,
    it.time,
    it.createdAt,
    it.created_at,
    it.checkpointTimestampMs,
    it.executedTimeMs,
  ];

  for (const v of candidates) {
    if (v == null) continue;

    if (typeof v === "number" && Number.isFinite(v)) {
      return v > 1e12 ? v : v * 1000; // seconds -> ms
    }
    if (typeof v === "string") {
      const n = Number(v);
      if (Number.isFinite(n)) return n > 1e12 ? n : n * 1000;
      const iso = Date.parse(v);
      if (!Number.isNaN(iso)) return iso;
    }
  }
  return null;
}

function preview(obj) {
  try {
    return JSON.parse(
      JSON.stringify(obj, (_k, v) => (typeof v === "string" && v.length > 120 ? v.slice(0, 120) + "…" : v))
    );
  } catch {
    return obj;
  }
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
