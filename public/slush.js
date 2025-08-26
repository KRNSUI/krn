// public/slush.js
// Minimal wallet adapter (replace internals when you wire Slush)
export const KRN_TYPE = "0x278c12e3bcc279248ea3e316ca837244c3941399f2bf4598638f4a8be35c09aa::krn::KRN";
export const TREASURY = "0x16838e026d0e3c214deb40f4dc765ad5ea47d0f488952b2f29f807e225cd3241"; // where 1 KRN goes

let _addr = null;

export async function connectWallet() {
  // TODO: replace with real Slush connect
  // Fake prompt while you integrate; keeps UI flow unblocked
  const v = prompt("Enter your Sui address (temporary until Slush connect):", _addr || "");
  if (!v) throw new Error("Wallet connect canceled");
  _addr = v.trim();
  return _addr;
}

export function getAddress() {
  return _addr;
}

// Build a "pay 1 KRN" intent. Replace this with Slush tx builder/signer later.
export async function payOneKRN({ memo = "" } = {}) {
  if (!_addr) await connectWallet();
  // This returns a mock object; on real Slush you’ll submit and get a digest back.
  // Keep the same shape so your server can verify when you go real.
  const fakeDigest = `SIM-${Date.now()}`;
  return { digest: fakeDigest, from: _addr, to: TREASURY, amount: "1", type: KRN_TYPE, memo };
}
