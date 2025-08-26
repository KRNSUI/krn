// public/stars.js

const FREE_MODE = true; // ⬅ set true for no-payment testing

function getClientId() {
  const key = "krn_client_id";
  let v = localStorage.getItem(key);
  if (!v) {
    v = crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2);
    localStorage.setItem(key, v);
  }
  return v;
}

export function initStars(root = document) {
  root.addEventListener("click", async (ev) => {
    const btn = ev.target.closest(".star-btn");
    if (!btn) return;
    ev.preventDefault();

    const postId = btn.getAttribute("data-id");
    if (!postId) return;

    btn.disabled = true;

    try {
      let addr = null, txDigest = null;

      if (!FREE_MODE && window.slush?.payKRN) {
        // paid mode
        const res = await window.slush.payKRN(1); // 1 KRN
        addr = res.address;
        txDigest = res.digest;
      } else {
        // free mode
        addr = `client:${getClientId()}`;
        txDigest = null; // server doesn't require it in free mode
      }

      const rr = await fetch("/stars/toggle", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ postId, addr, txDigest })
      });
      const out = await rr.json();

      if (!out.ok) throw new Error(out.error || "toggle failed");

      // update count + visual
      const cnt = btn.querySelector(".star-count");
      if (cnt) cnt.textContent = String(out.count ?? 0);
      btn.classList.toggle("is-starred", !!out.starred);
    } catch (e) {
      alert(e.message || "Could not process star. Please try again.");
      console.error(e);
    } finally {
      btn.disabled = false;
    }
  });
}
