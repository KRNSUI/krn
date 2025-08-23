// functions/bb.js
// Secure GET proxy for Blockberry Sui "coins" endpoints + best-effort price history.
// Your key stays server-side via env.BB_API_KEY.
//
// Supported modes:
//   - mode=coin                -> /sui/v1/coins/{coinType}
//   - mode=metadata            -> /sui/v1/coins/metadata/{coinType}
//   - mode=holders             -> /sui/v1/coins/{coinType}/holders?page&size&orderBy&sortBy
//   - mode=coins               -> /sui/v1/coins?page&size&orderBy&sortBy
//   - mode=wallet&address=...  -> /sui/v1/coins/wallet/{address}?page&size
//   - mode=total               -> /sui/v1/coins/total
//   - mode=totalVerified       -> /sui/v1/coins/total-verified
//   - mode=totalWithMarketCap  -> /sui/v1/coins/total-with-market-cap
//   - mode=priceHistory        -> tries to derive {labels, series} price array from metadata-like payloads
//
// Defaults: mode=coin for KRN type.

export async function onRequest({ request, env }) {
  if (!env.BB_API_KEY) {
    return j({ ok: false, error: "Missing BB_API_KEY binding" }, 500);
  }

  const KRN =
    "0x278c12e3bcc279248ea3e316ca837244c3941399f2bf4598638f4a8be35c09aa::krn::KRN";

  try {
    const u = new URL(request.url);
    const mode = (u.searchParams.get("mode") || "coin").toLowerCase();
    const coinType = u.searchParams.get("coinType") || KRN;

    const base = "https://api.blockberry.one/sui/v1";
    let target;

    // Helpers for common params
    const page = u.searchParams.get("page") ?? "0";
    const size = u.searchParams.get("size") ?? "20";
    const orderBy = u.searchParams.get("orderBy") ?? "DESC";
    const sortByDefault = (mode === "holders") ? "AMOUNT" : "AGE";
    const sortBy = u.searchParams.get("sortBy") ?? sortByDefault;

    switch (mode) {
      case "coin": {
        target = `${base}/coins/${encodeURIComponent(coinType)}`;
        break;
      }
      case "metadata": {
        target = `${base}/coins/metadata/${encodeURIComponent(coinType)}`;
        break;
      }
      case "holders": {
        const qs = new URLSearchParams({ page, size, orderBy, sortBy });
        target = `${base}/coins/${encodeURIComponent(coinType)}/holders?${qs}`;
        break;
      }
      case "coins": {
        const qs = new URLSearchParams({ page, size, orderBy, sortBy });
        target = `${base}/coins?${qs}`;
        break;
      }
      case "wallet": {
        const address = u.searchParams.get("address");
        if (!address) return j({ ok: false, error: "address is required" }, 400);
        const qs = new URLSearchParams({ page, size });
        target = `${base}/coins/wallet/${address}?${qs}`;
        break;
      }
      case "total": {
        target = `${base}/coins/total`;
        break;
      }
      case "totalverified": {
        target = `${base}/coins/total-verified`;
        break;
      }
      case "totalwithmarketcap": {
        target = `${base}/coins/total-with-market-cap`;
        break;
      }
      case "pricehistory": {
        // Fetch metadata first; many providers put price-related info there.
        target = `${base}/coins/metadata/${encodeURIComponent(coinType)}`;
        const meta = await upstreamJSON(target, env.BB_API_KEY);
        if (!meta.ok) return j(meta, meta.status || 502);

        // Try to extract price history from a few common shapes:
        // - meta.data.priceHistory -> [{time, price}] or [{t, p}] or [[ts, price]]
        // - meta.data.history.prices -> [[ts, price], ...] (CG-like shape)
        // - meta.priceHistory / meta.history / meta.market?.prices
        const { labels, series } = extractPriceHistory(meta.data);

        if (!labels.length || !series.length) {
          return j({
            ok: false,
            error: "No price history found in metadata",
            hint: "Blockberry coin metadata doesn't provide time-series; you may need a market API for OHLC.",
          }, 200);
        }

        return j({ ok: true, labels, series });
      }
      default: {
        return j({ ok: false, error: `Unsupported mode: ${mode}` }, 400);
      }
    }

    // Regular GET passthrough
    const r = await fetch(target, {
      headers: {
        accept: "application/json",
        "x-api-key": env.BB_API_KEY,
      },
    });

    const text = await r.text();
    if (!r.ok) {
      return j(
        { ok: false, error: `Upstream ${r.status}`, details: text.slice(0, 500), target },
        r.status
      );
    }

    let json;
    try { json = JSON.parse(text); }
    catch { return j({ ok: false, error: "Non-JSON upstream", preview: text.slice(0, 200), target }, 502); }

    return j({ ok: true, mode, target, data: json });
  } catch (err) {
    return j({ ok: false, error: String(err) }, 500);
  }
}

/* ---------------- helpers ---------------- */

async function upstreamJSON(url, key) {
  const r = await fetch(url, {
    headers: { accept: "application/json", "x-api-key": key },
  });
  const text = await r.text();
  let data = null;
  try { data = JSON.parse(text); } catch { /* ignore */ }
  return r.ok
    ? { ok: true, data }
    : { ok: false, status: r.status, details: text.slice(0, 500), target: url };
}

function extractPriceHistory(meta) {
  // Try several shapes
  const candidates =
    meta?.priceHistory ||
    meta?.data?.priceHistory ||
    meta?.history?.prices ||
    meta?.market?.prices ||
    meta?.prices ||
    [];

  let labels = [], series = [];

  // Array of pairs [[ts, price], ...]
  if (Array.isArray(candidates) && Array.isArray(candidates[0]) && candidates[0].length >= 2) {
    for (const pair of candidates) {
      const ts = toMs(pair[0]);
      const p = Number(pair[1]);
      if (ts && Number.isFinite(p)) {
        labels.push(new Date(ts).toISOString());
        series.push(p);
      }
    }
    return { labels, series };
  }

  // Array of objects [{time, price}] or [{t, p}] or similar
  if (Array.isArray(candidates) && typeof candidates[0] === "object") {
    for (const row of candidates) {
      const ts = toMs(row.time ?? row.t ?? row.ts ?? row.timestamp ?? row.date);
      const p = Number(row.price ?? row.p ?? row.value ?? row.close ?? row.avg);
      if (ts && Number.isFinite(p)) {
        labels.push(new Date(ts).toISOString());
        series.push(p);
      }
    }
    return { labels, series };
  }

  // Nothing matched
  return { labels: [], series: [] };
}

function toMs(v) {
  if (v == null) return null;
  if (typeof v === "number") return v > 1e12 ? v : v * 1000; // seconds → ms
  if (typeof v === "string") {
    const n = Number(v);
    if (Number.isFinite(n)) return n > 1e12 ? n : n * 1000;
    const iso = Date.parse(v);
    return Number.isNaN(iso) ? null : iso;
  }
  return null;
}

function j(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
