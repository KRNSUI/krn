// /public/slush.js
export async function ensureConnected() {
  // Your real Slush SDK may differ—this is a defensive wrapper.
  if (!window.Slush) return false;
  try {
    if (typeof window.Slush.isConnected === "function" && window.Slush.isConnected()) {
      return true;
    }
    if (typeof window.Slush.connect === "function") {
      await window.Slush.connect();
      return typeof window.Slush.isConnected === "function"
        ? window.Slush.isConnected()
        : true;
    }
  } catch {}
  return false;
}
