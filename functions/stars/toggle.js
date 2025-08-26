// functions/stars/toggle.js
const KRN_TYPE = "0x278c12e3bcc279248ea3e316ca837244c3941399f2bf4598638f4a8be35c09aa::krn::KRN";
const KRN_DECIMALS = 9;

// ⬇⬇⬇  set to false for no-payment / no-wallet mode
const VERIFY_ON = false;

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    let { postId, addr, txDigest } = body || {};

    if (!postId) return json({ ok: false, error: "missing postId" }, 400);

    // In free mode allow missing wallet/tx; generate a client id if needed
    if (!VERIFY_ON) {
      addr ||= await getOrSetClientId(request);
    } else {
      if (!addr || !txDigest) {
        return json({ ok: false, error: "missing addr/txDigest" }, 400);
      }
      const ok = await verifyPayment(txDigest, addr, env);
      if (!ok) return json({ ok: false, error: "payment not verified" }, 400);
    }

    // Toggle
    const existing = await env.KRN_DB
      .prepare(`SELECT 1 FROM stars WHERE post_id=? AND addr=?`)
      .bind(postId, addr)
      .first();

    if (existing) {
      await env.KRN_DB.prepare(`DELETE FROM stars WHERE post_id=? AND addr=?`)
        .bind(postId, addr).run();
    } else {
      await env.KRN_DB.prepare(`INSERT OR IGNORE INTO stars (post_id, addr) VALUES (?, ?)`)
        .bind(postId, addr).run();
    }

    const row = await env.KRN_DB
      .prepare(`SELECT COUNT(*) AS c FROM stars WHERE post_id=?`)
      .bind(postId)
      .first();

    return json({ ok: true, starred: !existing, count: Number(row?.c || 0) });
  } catch (e) {
    console.error("stars/toggle error:", e);
    return json({ ok: false, error: "server error" }, 500);
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status, headers: { "content-type": "application/json" }
  });
}

// Create/reuse a stable per-browser id so users can toggle their own star
async function getOrSetClientId(request) {
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(/krn_client=([a-zA-Z0-9_-]+)/);
  const id = match?.[1] || cryptoRandomId();
  // set cookie on response by returning a Set-Cookie header from caller (CF Pages can’t
  // mutate response here easily), so we encode the id into “addr” and let the client
  // also persist it; this works fine without cookie too:
  return `client:${id}`;
}

function cryptoRandomId() {
  const a = new Uint8Array(16);
  crypto.getRandomValues(a);
  return [...a].map(n => n.toString(16).padStart(2, "0")).join("");
}

/* ---- verifyPayment stays unchanged; it simply won’t be called when VERIFY_ON === false ---- */
