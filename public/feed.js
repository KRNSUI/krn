// public/feed.js
// Uses the shared preview-only censor from ./censor.js
import { censorText } from "./censor.js";

(() => {
  const feedEl = document.getElementById("feed");
  if (!feedEl) return;

  // Show expand if > PREVIEW_LIMIT chars, or if censoring changed the text
  const PREVIEW_LIMIT = 1000;

  // ---------- utilities ----------
  const esc = (s) =>
    String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const trunc = (s, n) => (s.length <= n ? s : s.slice(0, n) + "…");

  function pickTime(it) {
    const v =
      it.created_at ?? it.createdAt ?? it.created ?? it.time ?? it.timestamp;
    const d = v ? new Date(v) : new Date(NaN);
    return Number.isFinite(d.getTime()) ? d : null;
    // If your DB stores UTC strings, the browser will localize automatically.
  }

  const pickText = (it) => it.text ?? it.message ?? "";

  function normalizeList(payload) {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.results)) return payload.results;
    if (Array.isArray(payload?.rows)) return payload.rows;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
  }

  // ---------- load + render ----------
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

      // event delegation for show more/less
      feedEl.addEventListener("click", onRevealClick);
    } catch (e) {
      console.error("feed load error:", e);
      feedEl.innerHTML = `<div class="muted s">Could not load complaints.</div>`;
    }
  }

  function renderItem(it) {
    const id = String(it.id ?? it.ID ?? it.rowid ?? "");
    const d = pickTime(it);
    const when = d ? d.toLocaleString() : "";

    // RAW (as stored)
    const raw = pickText(it);

    // PREVIEW (censored + possibly truncated)
    // Use your shared censor ONLY for the preview
    const { text: censoredPreview } = censorText(raw);
    const preview = trunc(censoredPreview, PREVIEW_LIMIT);

    // Decide if we need an expand link
    const needsExpand =
      raw.length > PREVIEW_LIMIT || censoredPreview !== raw ||
      Boolean(it.is_sensitive ?? it.sensitive ?? it.flag_sensitive);

    // We render two spans:
    //   - short: censored preview
    //   - full: hidden; filled with *uncensored* text on first expand
    return `
      <div class="item" data-id="${esc(id)}">
        <div class="time">${esc(when)}</div>
        <pre class="msg">
          <span data-variant="short">${esc(preview)}</span>
          <span data-variant="full" style="display:none;"></span>
        </pre>
        ${
          needsExpand
            ? `<a href="#" class="reveal-link" data-id="${esc(
                id
              )}" data-state="closed">show more</a>`
            : ""
        }
      </div>
    `;
  }

  async function onRevealClick(ev) {
    const link = ev.target.closest(".reveal-link");
    if (!link) return;
    ev.preventDefault();

    const id = link.getAttribute("data-id") || "";
    const state = link.getAttribute("data-state") || "closed";
    const itemEl = link.closest(".item");
    if (!itemEl) return;

    const shortSpan = itemEl.querySelector('span[data-variant="short"]');
    const fullSpan = itemEl.querySelector('span[data-variant="full"]');

    if (state === "open") {
      // collapse back to preview
      fullSpan.style.display = "none";
      shortSpan.style.display = "inline";
      link.textContent = "show more";
      link.setAttribute("data-state", "closed");
      return;
    }

    // state === "closed" => first expand
    try {
      link.classList.add("is-loading");
      link.textContent = "loading…";

      // Fetch the ORIGINAL (uncensored) complaint from server
      // The server should return raw text (do not censor server-side)
      const r = await fetch(
        `/complaints?id=${encodeURIComponent(id)}&reveal=1`,
        { cache: "no-store" }
      );
      const one = await r.json();

      const fullRaw = one?.complaint?.text ?? one?.complaint?.message ?? "";
      // Always HTML-escape before inserting to DOM (prevents XSS)
      fullSpan.textContent = fullRaw; // set raw, then keep it as textContent
      // (textContent is already safe; no need to set innerHTML here)

      shortSpan.style.display = "none";
      fullSpan.style.display = "inline";
      link.textContent = "show less";
      link.setAttribute("data-state", "open");
    } catch (err) {
      console.error("reveal error:", err);
      link.textContent = "show more";
      alert("Failed to reveal.");
    } finally {
      link.classList.remove("is-loading");
    }
  }

  load();
})();
