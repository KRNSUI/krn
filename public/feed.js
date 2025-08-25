// public/feed.js
import { censorText } from "./censor.js";

(() => {
  const feedEl = document.getElementById("feed");
  if (!feedEl) return;

  /* ---------------- Utils ---------------- */
  const $esc = (s) =>
    String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const toB64 = (s) => btoa(unescape(encodeURIComponent(String(s))));
  const fromB64 = (b) => decodeURIComponent(escape(atob(String(b))));

  const twoLinePreview = (text) => text.split(/\r?\n/).slice(0, 2).join("\n");

  const pickTime = (it) => {
    const v =
      it.created_at ?? it.createdAt ?? it.created ?? it.time ?? it.timestamp;
    const d = v ? new Date(v) : new Date(NaN);
    return Number.isFinite(d.getTime()) ? d : null;
  };

  const pickText = (it) => it.text ?? it.message ?? "";

  const normalizeList = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.results)) return payload.results;
    if (Array.isArray(payload?.rows)) return payload.rows;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
  };

  const extractFullText = (obj) => {
    if (!obj) return "";
    if (obj.complaint?.text) return String(obj.complaint.text);
    if (obj.complaint?.message) return String(obj.complaint.message);
    if (typeof obj.complaint === "string") return obj.complaint;
    if (obj.text) return String(obj.text);
    if (obj.message) return String(obj.message);
    return "";
  };

  /* ---------------- Load feed ---------------- */
  async function load() {
    try {
      const res = await fetch("/complaints?limit=120", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const list = normalizeList(json);

      if (!list.length) {
        feedEl.innerHTML = `<div class="muted s">No complaints yet.</div>`;
        return;
      }

      feedEl.innerHTML = list.map(renderItem).join("");
    } catch (e) {
      console.error("feed load error:", e);
      feedEl.innerHTML = `<div class="muted s">Could not load complaints.</div>`;
    }
  }

  /* ---------------- Render each item ---------------- */
  function renderItem(it) {
    const id = String(it.id ?? it.ID ?? it.rowid ?? "");
    const when = (pickTime(it) || new Date()).toLocaleString();

    const raw = pickText(it);
    const rawB64 = toB64(raw);

    const { text: censored } = censorText(raw);
    const preview = twoLinePreview(censored);

    const needsReveal = censored !== raw || raw.split(/\r?\n/).length > 2;

    return `
      <div class="item" data-id="${$esc(id)}" data-raw-b64="${$esc(rawB64)}">
        <div class="time">${$esc(when)}</div>
        <pre class="msg">
          <span data-variant="short" class="inline">${$esc(preview)}</span>
          <span data-variant="full" class="inline hidden"></span>
        </pre>
        ${
          needsReveal
            ? `<a href="#" class="reveal-link" data-id="${$esc(
                id
              )}" data-state="closed">Reveal original</a>`
            : ""
        }
      </div>
    `;
  }
  
// ---------- CLICK: reveal / hide ----------
feedEl.addEventListener("click", async (ev) => {
  const link = ev.target.closest(".reveal-link");
  if (!link) return;
  ev.preventDefault();

  const id = link.getAttribute("data-id") || "";
  const itemEl = link.closest(".item");
  if (!itemEl) return;

  const shortSpan = itemEl.querySelector('span[data-variant="short"]');
  const fullSpan  = itemEl.querySelector('span[data-variant="full"]');

  const open = link.getAttribute("data-state") === "open";

  // HIDE
  if (open) {
    if (fullSpan) fullSpan.style.display = "none";
    if (shortSpan) shortSpan.style.display = "inline";
    link.setAttribute("data-state", "closed");
    link.textContent = "Reveal original";
    return;
  }

  // SHOW
  try {
    link.textContent = "Loading…";
    link.classList.add("is-loading");

    // fetch only once
    if (!fullSpan.getAttribute("data-loaded")) {
      const r = await fetch(`/complaints?id=${encodeURIComponent(id)}&reveal=1`, { cache: "no-store" });
      const payload = await r.json();

      // robustly extract text shape
      const fullRaw =
        (payload?.complaint?.text) ??
        (payload?.complaint?.message) ??
        (payload?.text) ??
        (payload?.message) ??
        (payload?.data?.text) ??
        (payload?.data?.message) ??
        (typeof payload?.complaint === "string" ? payload.complaint : "");

      fullSpan.textContent = fullRaw || "(no content)";
      fullSpan.setAttribute("data-loaded", "1");
    }

    // swap views
    if (shortSpan) shortSpan.style.display = "none";
    fullSpan.style.display = "inline";
    link.setAttribute("data-state", "open");
    link.textContent = "Hide original";
  } catch (err) {
    console.error("reveal error:", err);
    link.textContent = "Reveal original";
    alert("Failed to reveal.");
  } finally {
    link.classList.remove("is-loading");
  }
});

  load();
})();
