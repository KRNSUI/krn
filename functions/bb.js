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
    const limit = Math.max(50, Math.min(500, hours * 20)); // heuristic: ~20 tx/hour

    // We’ll try several endpoint patterns until one succeeds (200 OK)
    const paths = [
      // 1) often seen
      (base) =>
        withQS(
          `${base}/sui/v1/transactions/by-coin-type`,
          { network: "mainnet", coinType, page: "1", limit: String(limit) }
        ),
      // 2) coins/{coinType}/transactions
      (base) =>
        withQS(
          `${base}/sui/v1/coins/${encodeURIComponent(coinType)}/transactions`,
          { network: "mainnet", page: "1", limit: String(limit) }
        ),
      // 3) coin/{coinType}/transactions (singular)
      (base) =>
        withQS(
          `${base}/sui/v1/coin/${encodeURIComponent(coinType)}/transactions`,
          { network: "mainnet", page: "1", limit: String(limit) }
        ),
    ];

    const base = "https://api.blockberry.one";
    let lastErrorText = "";
    let raw;

    for (const makeUrl of paths) {
      const url = makeUrl(base);
      const res = await fetch(url, {
        headers: {
          accept: "application/json",
          "x-api-key": env.BB_API_KEY,
        },
      });

      const text = await res.text();
      // keep the most recent body for debugging if we fail
      lastErrorText = `status=${res.status} body=${truncate(text, 400)}`;

      if (!res.ok) {
        // try next pattern
        continue;
      }

      try {
        raw = JSON.parse(text);
      } catch {
        return json({
          ok: false,
          error: "Upstream returned non-JSON",
          details: lastErrorText,
        }, 502);
      }

      // got something OK; break out
      break;
    }

    if (!raw) {
      return json({
        ok: false,
        error: "Upstream 4xx/5xx",
        details: lastErrorText,
      }, 502);
    }

    // Normalize items array out of common shapes:
    // - { data: [...] }
    // - { list: [...] }
    // - [ ... ]
    const items = Array.isArray(raw?.data)
      ? raw.data
      : Array.isArray(raw?.list)
      ? raw.list
      : Array.isArray(raw)
      ? raw
      : [];

    const cutoff = Date.now() - hours * 3600 * 1000;

    // Bucket counts by hour (ts may be in different fields / units)
    const buckets = new Map(); // hourStartMs -> count
    for (const it of items) {
      const ts = pickTimestampMs(it);
      if (!ts || ts < cutoff) continue;
      const hourStart = Math.floor(ts / 3600000) * 3600000;
      buckets.set(hourStart, (buckets.get(hourStart) || 0) + 1);
    }

    // Build continuous hourly series, return ISO labels so your chart pretty-printer works
    const labels = [];
    const series = [];
    const start = Math.floor(cutoff / 3600000) * 3600000;
    for (let t = start; t <= Date.now(); t += 3600000) {
      labels.push(new Date(t).toISOString());
      series.push(buckets.get(t) || 0);
    }

    // Optional: debug passthrough
    if (urlIn.searchParams.get("debug") === "1") {
      return json({ ok: true, labels, series, rawPreview: preview(raw) });
    }

    return json({ ok: true, labels, series });
  } catch (err) {
    return json({ ok: false, error: String(err) }, 500);
  }
}

/* ---------------- helpers ---------------- */

function withQS(base, q) {
  const u = new URL(base);
  for (const [k, v] of Object.entries(q)) u.searchParams.set(k, v);
  return u.toString();
}

function pickTimestampMs(it) {
  // Try a handful of common fields; convert to ms if needed
  const candidates = [
    it.timestamp,
    it.time,
    it.createdAt,
    it.created_at,
    it.timestampMs,
    it.checkpointTimestampMs,
    it.executedTimeMs,
  ];

  for (const v of candidates) {
    if (v == null) continue;

    // ISO / string date
    if (typeof v === "string") {
      const n = Date.parse(v);
      if (!Number.isNaN(n)) return n;
      // string number?
      const nn = Number(v);
      if (Number.isFinite(nn)) {
        return nn > 1e12 ? nn : nn * 1000;
      }
    }

    // numeric seconds or ms
    if (typeof v === "number" && Number.isFinite(v)) {
      return v > 1e12 ? v : v * 1000;
    }
  }
  return null;
}

function truncate(s, n) {
  return s.length > n ? s.slice(0, n) + "…" : s;
}

function preview(obj) {
  try {
    return JSON.parse(JSON.stringify(obj, (_k, v) => (typeof v === "string" && v.length > 120 ? v.slice(0, 120) + "…" : v)));
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
