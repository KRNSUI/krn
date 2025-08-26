// /public/stars.js
import { connectWallet, getAddress, payOneKRN } from "./slush.js";

export async function fetchStars(ids = []) {
  if (!ids.length) return {};
  const url = new URL("/stars", location.origin);
  url.searchParams.set("ids", ids.join(","));
  const r = await fetch(url.toString(), { cache: "no-store" });
  const data = await r.json().catch(() => ({}));
  return data?.counts || {};
}

export async function checkUserStars(ids = [], userAddr = null) {
  if (!ids.length || !userAddr) return {};
  
  try {
    const url = new URL("/stars/user", location.origin);
    url.searchParams.set("ids", ids.join(","));
    url.searchParams.set("addr", userAddr);
    const r = await fetch(url.toString(), { cache: "no-store" });
    const data = await r.json().catch(() => ({}));
    return data?.starred || {};
  } catch (error) {
    console.warn("Could not check user stars:", error);
    return {};
  }
}

export async function postStarToggle({ id, dir }) {
  const demo = localStorage.getItem("krn_no_pay") === "1";
  
  // Get wallet address for the request
  let addr = null;
  if (!demo) {
    try {
      addr = getAddress();
      if (!addr) {
        // Try to connect wallet if not connected
        const { ensureConnected } = await import("./slush.js");
        const connected = await ensureConnected();
        if (connected) {
          addr = getAddress();
        }
      }
    } catch (error) {
      console.warn("Could not get wallet address:", error);
    }
  }

  // If no wallet address and not in demo mode, use a placeholder
  if (!addr && !demo) {
    addr = "demo_user_" + Date.now();
  }

  const r = await fetch("/stars/toggle", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ id, dir, addr, demo }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || !data?.ok) {
    throw new Error(data?.error || `HTTP ${r.status}`);
  }
  return data; // { ok:true, count: number, operation: string, cost: number, reason: string, message: string }
}

export async function hydrateStarCounts(root = document) {
  const ids = [...root.querySelectorAll('.stars[data-stars-for]')]
    .map(n => n.getAttribute("data-stars-for"))
    .filter(Boolean);
  if (!ids.length) return;
  const map = await fetchStars(ids).catch(() => ({}));
  for (const id of ids) {
    const out = root.querySelector(`.star-count[data-id="${CSS.escape(id)}"]`);
    if (out && id in map) out.textContent = String(map[id]);
  }
}

export async function hydrateUserStarStates(root = document) {
  try {
    const { getAddress } = await import("./slush.js");
    const userAddr = getAddress();
    if (!userAddr) return; // No wallet connected

    const ids = [...root.querySelectorAll('.item')]
      .map(el => el.getAttribute("data-id"))
      .filter(Boolean);
    
    if (!ids.length) return;

    const userStars = await checkUserStars(ids, userAddr);
    
    // Update button states
    for (const id of ids) {
      const btn = root.querySelector(`.star-toggle[data-id="${CSS.escape(id)}"]`);
      if (btn && id in userStars) {
        btn.setAttribute("aria-pressed", "true");
        btn.setAttribute("data-dir", "down"); // Now it's for unstarring
        btn.title = "Remove star";
      }
    }
  } catch (error) {
    console.warn("Could not hydrate user star states:", error);
  }
}

export function initStars(root = document) {
  root.addEventListener("click", async (ev) => {
    const btn = ev.target.closest(".star-toggle");
    if (!btn) return;
    ev.preventDefault();

    const id = btn.getAttribute("data-id") || "";
    if (!id) return;

    const currentlyOn = btn.getAttribute("aria-pressed") === "true";
    const dir = currentlyOn ? "down" : "up";

    // Paid vs demo flow
    let demo = localStorage.getItem("krn_no_pay") === "1";
    if (!demo) {
      try {
        const { ensureConnected } = await import("./slush.js");
        const ok = await ensureConnected();
        if (!ok) {
          const goDemo = confirm("Couldn’t connect Slush. Continue in demo mode (no payment)?");
          if (!goDemo) return;
          localStorage.setItem("krn_no_pay", "1");
          demo = true;
        }
      } catch {
        const goDemo = confirm("Wallet connect unavailable. Continue in demo mode (no payment)?");
        if (!goDemo) return;
        localStorage.setItem("krn_no_pay", "1");
        demo = true;
      }
    }

    btn.setAttribute("disabled", "true");
    try {
      const { count, operation, cost, reason, message } = await postStarToggle({ id, dir });
      
      // Update button state
      if (dir === "up") {
        btn.setAttribute("aria-pressed", "true");
        btn.setAttribute("data-dir", "down");
        btn.title = "Remove star";
      } else {
        btn.setAttribute("aria-pressed", "false");
        btn.setAttribute("data-dir", "up");
        btn.title = "Star this post (costs 1+ KRN)";
      }
      
      const out = root.querySelector(`.star-count[data-id="${CSS.escape(id)}"]`);
      if (out) out.textContent = String(count ?? 0);
      
      // Show success message with cost
      if (message) {
        console.log(message);
        // Show user-friendly alert with cost
        if (cost > 0) {
          alert(`${message}\n\nCost: ${cost} KRN\nReason: ${reason}`);
        } else {
          alert(message);
        }
      }
    } catch (e) {
      alert("Could not process star. Please try again.");
      console.error(e);
    } finally {
      btn.removeAttribute("disabled");
    }
  });
}
