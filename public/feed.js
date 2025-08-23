// public/feed.js
(async function () {
  const feedEl = document.getElementById("feed");
  if (!feedEl) return;

  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  async function load() {
    try {
      const r = await fetch("/complaints?limit=120", { cache: "no-store" });
      const data = await r.json();
      if (!data.ok) throw new Error(data.error || "Failed to load complaints");

      if (!data.items.length) {
        feedEl.innerHTML = `<div class="muted s">No complaints yet.</div>`;
        return;
      }

      feedEl.innerHTML = data.items.map(renderItem).join("");
      // Wire up reveals
      feedEl.querySelectorAll("button[data-reveal]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          btn.disabled = true;
          const id = btn.getAttribute("data-id");
          try {
            const rr = await fetch(`/complaints?id=${encodeURIComponent(id)}&reveal=1`, { cache: "no-store" });
            const one = await rr.json();
            if (one?.ok && one.complaint) {
              const pre = feedEl.querySelector(`pre[data-id="${id}"]`);
              if (pre) pre.textContent = one.complaint.text || "";
              btn.remove(); // no longer needed
            } else {
              btn.disabled = false;
              alert("Failed to reveal.");
            }
          } catch {
            btn.disabled = false;
            alert("Failed to reveal.");
          }
        });
      });
    } catch (e) {
      feedEl.innerHTML = `<div class="muted s">Could not load complaints.</div>`;
      console.error(e);
    }
  }

  function renderItem(it) {
    const time = new Date(it.created_at).toLocaleString();
    const revealBtn = it.is_sensitive
      ? `<button class="btn s" data-reveal data-id="${it.id}">Reveal (sensitive)</button>`
      : "";
    return `
      <div class="item">
        <div class="time">${escapeHtml(time)}</div>
        <pre class="msg" data-id="${it.id}">${escapeHtml(it.text || "")}</pre>
        ${revealBtn}
      </div>
    `;
  }

  load();
})();
