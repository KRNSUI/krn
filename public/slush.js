// /public/slush.js

// Toggle: if true, skip wallet & payments (demo / staging)
export const FREE_MODE = Boolean(window.__STAR_FREE_MODE__);

/**
 * Connect Slush wallet (stub). Returns a “connected” flag.
 * Replace with real window.slush integration when you’re ready.
 */
export async function connectWallet() {
  if (FREE_MODE) return { connected: true, address: null };

  if (!window.slush) {
    throw new Error("Slush wallet not found (window.slush is undefined).");
  }
  // Example real flow (uncomment when Slush is ready):
  // await window.slush.connect();
  // return { connected: true, address: window.slush.account?.address || null };

  // Temporary no-op until Slush is integrated
  return { connected: true, address: null };
}

/**
 * Get the currently connected address (stub).
 */
export function getAddress() {
  if (FREE_MODE) return null;
  // return window.slush?.account?.address || null; // when Slush is ready
  return null;
}

/**
 * Pay 1 KRN (stub). Keep signature the same so caller code doesn’t change.
 * @param {Object} opts
 * @param {string} [opts.to] - destination address/object if needed
 * @param {number} [opts.amount=1] - amount of KRN
 */
export async function payOneKRN({ to = "", amount = 1 } = {}) {
  if (FREE_MODE) return { ok: true, txId: null, mode: "free" };

  if (!window.slush) {
    throw new Error("Slush wallet not available for payment.");
  }
  // Example real flow (uncomment & adapt once Slush is ready):
  // const res = await window.slush.pay({
  //   type: "coin::transfer",
  //   coinType: "0x278c12e3bcc279248ea3e316ca837244c3941399f2bf4598638f4a8be35c09aa::krn::KRN",
  //   to,
  //   amount
  // });
  // return { ok: true, txId: res?.digest || null, mode: "paid" };

  // Temporary no-op
  return { ok: true, txId: null, mode: "noop" };
}

export default {
  FREE_MODE,
  connectWallet,
  getAddress,
  payOneKRN,
};
