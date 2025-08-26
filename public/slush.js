// /public/slush.js

// Safe global reference for browser (window) or Workers (globalThis)
const g = (typeof window !== "undefined" ? window : globalThis);

// Read free-mode flag safely (works in Workers and browser)
export const FREE_MODE = Boolean(
  (g && g.__STAR_FREE_MODE__) || (g && g.__FREE_MODE__)
);

/**
 * Connect Slush wallet (stub).
 * Always guard browser-only APIs with `typeof window !== "undefined"`.
 */
export async function connectWallet() {
  if (FREE_MODE) return { connected: true, address: null };

  if (typeof window === "undefined" || !g.slush) {
    // In Workers or wallet not present
    throw new Error("Slush wallet not found.");
  }

  // Example (when Slush is available):
  // await g.slush.connect();
  // return { connected: true, address: g.slush.account?.address || null };

  return { connected: true, address: null };
}

/** Get current address (stub) */
export function getAddress() {
  if (FREE_MODE) return null;
  if (typeof window === "undefined") return null;
  // return g.slush?.account?.address || null; // when ready
  return null;
}

/**
 * Pay 1 KRN (stub).
 * Keep signature; guard browser API.
 */
export async function payOneKRN({ to = "", amount = 1 } = {}) {
  if (FREE_MODE) return { ok: true, txId: null, mode: "free" };

  if (typeof window === "undefined" || !g.slush) {
    throw new Error("Slush wallet not available for payment.");
  }

  // Example real flow:
  // const res = await g.slush.pay({
  //   type: "coin::transfer",
  //   coinType:
  //     "0x278c12e3bcc279248ea3e316ca837244c3941399f2bf4598638f4a8be35c09aa::krn::KRN",
  //   to,
  //   amount
  // });
  // return { ok: true, txId: res?.digest || null, mode: "paid" };

  return { ok: true, txId: null, mode: "noop" };
}

export default { FREE_MODE, connectWallet, getAddress, payOneKRN };
