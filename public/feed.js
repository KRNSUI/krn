// public/feed.js (ES module)
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

  function pickTime(it) {
    const v = it.created_at ?? it.createdAt ?? it.created ?? it.time ?? it.timestamp;
    const d = v ? new Date(v) : new Date(NaN);
    return Number.isFinite(d.getTime()) ? d : null;
  }
  function pickText(it) {
    return it.text ?? it.message ?? "";
  }
  function normalizeList(payload) {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.results)) return payload.results;
    if (Array.isArray(payload?.rows)) return payload.rows;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
  }

  /** Robustly pull full original text from many possible server shapes */
  function extractFullText(obj) {
    if (!obj) return "";
    if (typeof obj === "string") return obj;
    if (obj.text) return String(obj.text);
    if (obj.message) return String(obj.message);

    if (obj.ok && obj.complaint?.text) return String(obj.complaint.text);
    if (obj.ok && obj.complaint?.message) return String(obj.complaint.message);
    if (typeof obj.complaint === "string") return obj.complaint;

    const arrays = [obj.items, obj.results, obj.rows, obj.data, obj.list, obj.complaints]
      .filter(Array.isArray);
    for (const arr of arrays) {
      const first = arr[0] || {};
      if (first.text) return String(first.text);
      if (first.message) return String(first.message);
    }

    const nested = [obj.data, obj.item, obj.result, obj.row]
      .filter((x) => x && typeof x === "object");
    for (const n of nested) {
      if (n.text) return String(n.text);
      if (n.message) return String(n.message);
    }
    return "";
  }

  /* ---------------- Load & Render ---------------- */
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

  function renderItem(it) {
    const id = String(it.id ?? it.ID ?? it.rowid ?? "");
    const d = pickTime(it);
    const when = d ? d.toLocaleString() : "";

    const raw = pickText(it);
    const { text: censored } = censorText(raw);

    // Always show first 2 lines
    const lines = censored.split(/\r?\n/);
    const preview = lines.slice(0, 2).join("\n");

    // Reveal only if censoring changed text OR there are more than 2 lines
    const needsReveal = (censored !== raw) || (lines.length > 2);
    const noRevealClass = needsReveal ? "" : " no-reveal";

    return `
      <div class="item${noRevealClass}" data-id="${$esc(id)}">
        <div class="time">${$esc(when)}</div>
        <pre class="msg">
          <span data-variant="short" class="inline">${$esc(preview)}</span>
          <span data-variant="full" class="inline hidden"></span>
        </pre>
        ${
          needsReveal
            ? `<a href="#" class="reveal-link" data-id="${$esc(id)}" data-state="closed">Reveal original</a>`
            : ""
        }
      </div>
    `;
  }

  /* ---------------- Reveal / Hide original ---------------- */
  feedEl.addEventListener("click", async (ev) => {
    const link = ev.target.closest(".reveal-link");
    if (!link) return;
    ev.preventDefault();

    const id = link.getAttribute("data-id") || "";
    const state = link.getAttribute("data-state") || "closed";
    const itemEl = link.closest(".item");
    if (!itemEl) return;

    const shortSpan = itemEl.querySelector('span[data-variant="short"]');
    const fullSpan  = itemEl.querySelector('span[data-variant="full"]');

    if (state === "closed") {
      try {
        link.textContent = "Loading…";
        link.classList.add("is-loading");

        const r = await fetch(`/complaints?id=${encodeURIComponent(id)}&reveal=1`, { cache: "no-store" });
        const payload = await r.json();
        const fullRaw = extractFullText(payload);

        fullSpan.textContent = fullRaw || "(no content)";
        fullSpan.classList.remove("hidden");
        shortSpan.classList.add("hidden");

        link.textContent = "Hide original";
        link.setAttribute("data-state", "open");
      } catch (err) {
        console.error("reveal error:", err);
        link.textContent = "Reveal original";
        alert("Failed to reveal.");
      } finally {
        link.classList.remove("is-loading");
      }
      return;
    }

    // collapse
    if (state === "open") {
      fullSpan.classList.add("hidden");
      shortSpan.classList.remove("hidden");
      link.textContent = "Reveal original";
      link.setAttribute("data-state", "closed");
    }
  });

  load();
})();
