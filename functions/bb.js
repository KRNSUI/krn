// functions/bb.js
export async function onRequest({ request, env }) {
  const coinType =
    "0x278c12e3bcc279248ea3e316ca837244c3941399f2bf4598638f4a8be35c09aa::krn::KRN";

  if (!env.BB_API_KEY) {
    return json({ ok: false, error: "Missing BB_API_KEY binding" }, 500);
  }

  const urlIn = new URL(request.url);
  const hours = clampInt(urlIn.searchParams.get("hours"), 24, 1, 72);
  const pageSize = clampInt(urlIn.searchParams.get("size"), 10, 1, 50);

  const headers = { accept: "application/json", "x-api-key": env.BB_API_KEY };

  const fetchJSON = async (path) => {
    const url = `https://api.blockberry.one/sui/v1${path}`;
    const r = await fetch(url, { headers });
    const t = await r.text();
    if (!r.ok) throw new Error(`${path} → ${r.status}: ${truncate(t, 240)}`);
    return JSON.parse(t);
  };

  try {
    // 1) Core coin info (often includes decimals + totals)
    const core = await fetchJSON(`/coins/${encodeURIComponent(coinType)}`).catch(() => ({}));

    // 2) Metadata (name, symbol, decimals, logo…)
    const meta = await fetchJSON(`/coins/metadata/${encodeURIComponent(coinType)}`).catch(() => ({}));

    const symbol = pickFirst(meta?.symbol, core?.symbol, "KRN");
    const decimals = toInt(pickFirst(meta?.decimals, core?.decimals, 9));

    // ---- total supply normalization ----
    // Try several common keys Blockberry may expose
    const totalRawCandidate = pickFirst(
      core?.total,
      core?.totalSupply,
      core?.total_supply,
      core?.supply,
      core?.amount,
      core?.data?.total
    );

    const totalSupplyRaw = totalRawCandidate != null ? String(totalRawCandidate) : null;
    const totalSupply = totalSupplyRaw != null
      ? toHumanBigInt(totalSupplyRaw, decimals, 4) // "123.4567"
      : null;

    // 3) Top holders (optional UI)
    const holders = await fetchJSON(
      `/coins/${encodeURIComponent(coinType)}/holders?page=0&size=${pageSize}&orderBy=DESC&sortBy=AMOUNT`
    ).catch(() => ({ data: [] }));

    // 4) Tx/activity series (may 400 for some coins; that's OK)
    let labels = [], series = [], txWarning;
    try {
      const limit = Math.max(50, Math.min(500, hours * 20));
      const tx = await fetchJSON(`/coins/${encodeURIComponent(coinType)}/transactions?page=0&size=${limit}`);
      const items = Array.isArray(tx?.data) ? tx.data : Array.isArray(tx) ? tx : [];
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
    }

    // Debug aid
    if (urlIn.searchParams.get("debug") === "1") {
      return json({
        ok: true,
        coinRaw: core,
        metaRaw: meta,
        normalized: { symbol, decimals, totalSupplyRaw, totalSupply },
        topHolders: holders?.data ?? [],
        priceSeries: { labels, series },
        warnings: txWarning ? { txWarning } : undefined
      });
    }

    return json({
      ok: true,
      coin: { symbol, decimals, totalSupplyRaw, totalSupply, metadata: meta },
      topHolders: holders?.data ?? [],
      priceSeries: { labels, series },
      warnings: txWarning ? { txWarning } : undefined
    });
  } catch (err) {
    return json({ ok: false, error: String(err) }, 500);
  }
}

/* ---------- helpers ---------- */
function pickFirst(...vals) {
  for (const v of vals) if (v !== undefined && v !== null) return v;
  return undefined;
}
function toInt(v, def = 0) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : def;
}
function clampInt(v, def, min, max) {
  const n = parseInt(v ?? def, 10);
  if (Number.isNaN(n)) return def;
  return Math.max(min, Math.min(max, n));
}
function pickTimestampMs(it) {
  const cands = [
    it.timestamp, it.time, it.createdAt, it.created_at,
    it.timestampMs, it.checkpointTimestampMs, it.executedTimeMs
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
// Convert big-int string with `decimals` to a human string w/ up to `maxFrac` decimals
function toHumanBigInt(raw, decimals, maxFrac = 2) {
  const neg = String(raw).startsWith("-");
  let s = neg ? String(raw).slice(1) : String(raw);
  // strip non-digits just in case
  s = s.replace(/\D/g, "") || "0";
  const pad = s.padStart(decimals + 1, "0");
  let int = pad.slice(0, pad.length - decimals);
  let frac = pad.slice(pad.length - decimals);
  // trim/limit fraction
  frac = frac.replace(/0+$/g, "").slice(0, maxFrac);
  int = int.replace(/^0+(?=\d)/, "");
  return (neg ? "-" : "") + (int || "0") + (frac ? "." + frac : "");
}
function truncate(s, n) { return String(s).length > n ? String(s).slice(0, n) + "…" : String(s); }
function json(body, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status, headers: { "content-type": "application/json; charset=utf-8" }
  });
}
