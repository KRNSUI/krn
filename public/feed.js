// public/feed.js (ES module)
import { censorText } from "/public/censor.js";

const PREVIEW_LIMIT = 200;

const $esc = (s) =>
  String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const truncate = (s, n) => (s.length <= n ? s : s.slice(0, n) + "…");

function pickTime(it) {
  const v = it.created_at ?? it.createdAt ?? it.created ?? it.time ?? it.timestamp;
  const d = v ? new Date(v) : new Date(NaN);
  return Number.isFinite(d.getTime()) ? d : null;
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

/** Try many common shapes to locate the full message text */
function extractFullText(payload) {
  if (!payload) return "";

  // direct object
  if (typeof payload.text === "string") return payload.text;
  if (typeof payload.message === "string") return payload.message;

  // nested fields
  if (payload.complaint) {
    if (typeof payload.complaint.text === "string") return payload.complaint.text;
    if (typeof payload.complaint.message === "string") return payload.complaint.message;
  }
  if (payload.data) {
    if (typeof payload.data.text === "string") return payload.data.text;
    if (typeof payload.data.message === "string") return payload.data.message;
  }
  if (payload.item) {
    if (typeof payload.item.text === "string") return payload.item.text;
    if (typeof payload.item.message === "string") return payload.item.message;
  }

  // arrays
  if (Array.isArray(payload) && payload.length) {
    const c = payload[0];
    return String(c?.text ?? c?.message ?? "");
  }
  for (const k of ["items", "results", "rows", "data"]) {
    const arr = payload?.[k];
    if (Array.isArray(arr) && arr.length) {
      const c = arr[0];
      return String(c?.text ?? c?.message ?? "");
    }
  }
  return "";
}

async function load() {
  const feedEl = document.getElementById("feed");
  if (!feedEl) return;

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
    // event delegation for reveal links
    feedEl.addEventListener("click", onRevealClick);
  } catch (e) {
    console.error("feed load error:", e);
    const feedEl = document.getElementById("feed");
    if (feedEl) feedEl.innerHTML = `<div class="muted s">Could not load complaints.</div>`;
  }
}

function renderItem(it) {
  const id = String(it.id ?? it.ID ?? it.rowid ?? "");
  const when = (pickTime(it) || new Date()).toLocaleString();

  const raw = pickText(it);
  const censoredPreview = truncate(censorText(raw), PREVIEW_LIMIT);
  const needsReveal = raw.length > PREVIEW_LIMIT || censorText(raw) !== raw;

  return `
    <div class="item" data-id="${$esc(id)}">
      <div class="time">${$esc(when)}</div>
      <pre class="msg">
<span data-variant="short" class="inline">${$esc(censoredPreview)}</span><span data-variant="full" class="inline hidden"></span>
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

async function onRevealClick(ev) {
  const link = ev.target.closest(".reveal-link");
  if (!link) return;
  ev.preventDefault();

  const id = link.getAttribute("data-id") || "";
  const itemEl = link.closest(".item");
  if (!itemEl) return;

  const shortSpan = itemEl.querySelector('span[data-variant="short"]');
  const fullSpan = itemEl.querySelector('span[data-variant="full"]');
  const state = link.getAttribute("data-state") || "closed";

  if (state === "closed") {
    try {
      link.textContent = "Loading…";
      link.classList.add("is-loading");

      // 1) Try /complaints?id=…&reveal=1
      let rawFull = "";
      try {
        const r1 = await fetch(`/complaints?id=${encodeURIComponent(id)}&reveal=1`, { cache: "no-store" });
        const p1 = await r1.json();
        rawFull = extractFullText(p1);
      } catch {}

      // 2) Fallback: /complaints?id=…
      if (!rawFull) {
        try {
          const r2 = await fetch(`/complaints?id=${encodeURIComponent(id)}`, { cache: "no-store" });
          const p2 = await r2.json();
          rawFull = extractFullText(p2);
        } catch {}
      }

      fullSpan.textContent = rawFull || "(original not available)";
      fullSpan.classList.remove("hidden");
      shortSpan.classList.add("hidden");

      link.textContent = "Hide original";
      link.setAttribute("data-state", "open");
    } catch (e) {
      console.error("reveal error:", e);
      link.textContent = "Reveal original";
      alert("Failed to reveal.");
    } finally {
      link.classList.remove("is-loading");
    }
    return;
  }

  // collapse
  fullSpan.classList.add("hidden");
  shortSpan.classList.remove("hidden");
  link.textContent = "Reveal original";
  link.setAttribute("data-state", "closed");
}

document.addEventListener("DOMContentLoaded", load);
