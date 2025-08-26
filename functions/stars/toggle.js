const KRN_TYPE = "0x278c12e3bcc279248ea3e316ca837244c3941399f2bf4598638f4a8be35c09aa::krn::KRN";
const KRN_DECIMALS = 9; // 1 KRN == 10^9 base units
const VERIFY_ON = true; // set false to smoke-test round-trip quickly

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const { postId, addr, txDigest } = body || {};

    if (!postId || !addr || !txDigest) {
      return json({ ok: false, error: "missing fields" }, 400);
    }

    if (VERIFY_ON) {
      const ok = await verifyPayment(txDigest, addr, env);
      if (!ok) return json({ ok: false, error: "payment not verified" }, 400);
    }

    // Toggle: if exists → remove; else → add
    const existing = await env.KRN_DB
      .prepare(`SELECT 1 FROM stars WHERE post_id=? AND addr=?`)
      .bind(postId, addr)
      .first();

    if (existing) {
      await env.KRN_DB
        .prepare(`DELETE FROM stars WHERE post_id=? AND addr=?`)
        .bind(postId, addr)
        .run();
    } else {
      await env.KRN_DB
        .prepare(`INSERT OR IGNORE INTO stars (post_id, addr) VALUES (?, ?)`)
        .bind(postId, addr)
        .run();
    }

    const countRow = await env.KRN_DB
      .prepare(`SELECT COUNT(*) AS c FROM stars WHERE post_id=?`)
      .bind(postId)
      .first();

    return json({
      ok: true,
      starred: !existing,
      count: Number(countRow?.c || 0)
    });
  } catch (e) {
    console.error("stars/toggle error:", e);
    return json({ ok: false, error: "server error" }, 500);
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json" }
  });
}

/**
 * Verify the tx actually paid 1 KRN.
 * Uses sui_getTransactionBlock via a fullnode RPC.
 */
async function verifyPayment(txDigest, addr, env) {
  try {
    const RPC = env.SUI_RPC || "https://fullnode.mainnet.sui.io:443";
    const body = {
      jsonrpc: "2.0",
      id: 1,
      method: "sui_getTransactionBlock",
      params: [txDigest, {
        showInput: true,
        showEffects: true,
        showEvents: true,
        showBalanceChanges: true
      }]
    };

    const r = await fetch(RPC, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });
    const j = await r.json();

    const status = j?.result?.effects?.status?.status;
    if (status !== "success") return false;

    const changes = j?.result?.balanceChanges || [];
    const wantCoinType = `0x2::coin::Coin<${KRN_TYPE}>`;
    const wantAmount = -(10 ** KRN_DECIMALS); // payer’s balance change is negative

    // We accept either:
    // - A direct balance change of -1 KRN for the payer in the KRN coin type, OR
    // - A Pay that nets out -1 KRN in balanceChanges
    const ok = changes.some(ch =>
      ch?.owner?.AddressOwner === addr &&
      ch?.coinType === wantCoinType &&
      Number(ch?.amount) === wantAmount
    );

    return !!ok;
  } catch (e) {
    console.warn("verifyPayment error (treat as fail):", e);
    return false;
  }
}
