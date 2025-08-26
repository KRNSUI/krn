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

/**
 * Ensure wallet is connected, prompting user if needed.
 * This function is called by the stars system to verify wallet connection.
 */
export async function ensureConnected() {
  if (FREE_MODE) return true;

  try {
    // Check if already connected
    const address = getAddress();
    if (address) return true;

    // Try to connect
    const result = await connectWallet();
    if (result.connected) return true;

    // If connection failed, prompt user
    const shouldConnect = confirm("Connect your Slush wallet to star posts?");
    if (shouldConnect) {
      const retryResult = await connectWallet();
      return retryResult.connected;
    }
    
    return false;
  } catch (error) {
    console.warn("Wallet connection failed:", error);
    
    // Prompt user to continue in demo mode
    const goDemo = confirm("Wallet connection failed. Continue in demo mode (no payment)?");
    if (goDemo) {
      // Set demo mode flag
      if (typeof window !== "undefined") {
        localStorage.setItem("krn_no_pay", "1");
      }
      return true; // Allow demo mode
    }
    
    return false;
  }
}

/** Get current address (stub) */
export function getAddress() {
  if (FREE_MODE) return null;
  if (typeof window === "undefined") return null;
  // return g.slush?.account?.address || null; // when ready
  return null;
}

/**
 * Pay KRN tokens (stub).
 * Keep signature; guard browser API.
 */
export async function payKRN({ to = "", amount = 1 } = {}) {
  if (FREE_MODE) return { ok: true, txId: null, mode: "free" };

  if (typeof window === "undefined" || !g.slush) {
    throw new Error("Slush wallet not available for payment.");
  }

  // Example real flow:
  // const res = await g.slush.pay({
  //   type: "coin::transfer",
  //   coinType:
  //     "0x278c12e3bcc279248ea3e316ca837244c3941399f2bf4598638f4a8be35c09aa::krn::KRN",
  //   amount
  // });
  // return { ok: true, txId: res?.digest || null, mode: "paid" };

  return { ok: true, txId: null, mode: "noop" };
}

// Keep backward compatibility
export const payOneKRN = payKRN;

export default { FREE_MODE, connectWallet, ensureConnected, getAddress, payOneKRN };
