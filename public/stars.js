// /public/stars.js
export async function fetchStars(ids = []) {
  if (!ids.length) return {};
  const url = new URL("/stars", location.origin);
  url.searchParams.set("ids", ids.join(","));
  const r = await fetch(url.toString(), { cache: "no-store" });
  const data = await r.json().catch(() => ({}));
  return data?.counts || {};
}

export async function postStarToggle({ id, dir }) {
  const demo = localStorage.getItem("krn_no_pay") === "1";
  const r = await fetch("/stars/toggle", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ id, dir, demo }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || !data?.ok) {
    throw new Error(data?.error || `HTTP ${r.status}`);
  }
  return data; // { ok:true, count: number }
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
      const { count } = await postStarToggle({ id, dir });
      btn.setAttribute("aria-pressed", (!currentlyOn).toString());
      const out = root.querySelector(`.star-count[data-id="${CSS.escape(id)}"]`);
      if (out) out.textContent = String(count ?? 0);
    } catch (e) {
      alert("Could not process star. Please try again.");
      console.error(e);
    } finally {
      btn.removeAttribute("disabled");
    }
  });
}
