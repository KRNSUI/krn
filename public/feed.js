// public/feed.js
import { censorText } from "./censor.js";

(() => {
  const feedEl = document.getElementById("feed");
  if (!feedEl) return;

  /* ---------------- Config for paging ---------------- */
  const FETCH_LIMIT = 50; // how many per page

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

  /* ---------------- Inject “Older/Newer” text links (no HTML edits needed) ---------------- */
  const nav = document.getElementById("feed-nav") || (() => {
    const d = document.createElement("div");
    d.id = "feed-nav";
    d.className = "feed-nav";
    d.innerHTML = `
      <a href="#" id="newer-link" class="feed-link hidden">← Newer</a>
      <a href="#" id="older-link" class="feed-link">Older →</a>
    `;
    feedEl.insertAdjacentElement("afterend", d);
    return d;
  })();
  const olderLink = nav.querySelector("#older-link");
  const newerLink = nav.querySelector("#newer-link");

  // lightweight styles if you haven't added CSS; safe to omit
  if (!document.getElementById("feed-nav-inline-style")) {
    const style = document.createElement("style");
    style.id = "feed-nav-inline-style";
    style.textContent = `
      .feed-link{display:inline-block;margin:.5rem .75rem;font-size:.9rem;color:var(--accent);text-decoration:none;opacity:.9;cursor:pointer}
      .feed-link:hover{text-decoration:underline;opacity:1}
      .feed-link.hidden{display:none}
    `;
    document.head.appendChild(style);
  }

  /* ---------------- Paging state ---------------- */
  let cursor = null;     // created_at of last visible item (for /complaints?before=…)
  let hasHistory = false; // whether we've paged older at least once

  /* ---------------- Load feed (supports append + cursor) ---------------- */
  async function load({ append = false } = {}) {
    try {
      const url = new URL("/complaints", location.origin);
      url.searchParams.set("limit", String(FETCH_LIMIT));
      if (append && cursor) url.searchParams.set("before", cursor);

      const res = await fetch(url.toString(), { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const list = normalizeList(await res.json());

      if (!list.length) {
        if (!append) {
          feedEl.innerHTML = `<div class="muted s">No complaints yet.</div>`;
        }
        // if no more, hide Older
        olderLink?.classList.add("hidden");
        return;
      }

      const html = list.map(renderItem).join("");

      if (append) {
        feedEl.insertAdjacentHTML("beforeend", html);
        hasHistory = true;
      } else {
        feedEl.innerHTML = html;
        hasHistory = false;
      }

      // move cursor to the last item we just drew
      const last = list[list.length - 1];
      cursor =
        last?.created_at ??
        last?.createdAt ??
        last?.time ??
        last?.timestamp ??
        null;

      // toggle links
      // show Older if we likely have more (equal page size)
      if (olderLink) olderLink.classList.toggle("hidden", list.length < FETCH_LIMIT);
      // show Newer only if we’ve gone into history
      if (newerLink) newerLink.classList.toggle("hidden", !hasHistory);
    } catch (e) {
      console.error("feed load error:", e);
      if (!append) {
        feedEl.innerHTML = `<div class="muted s">Could not load complaints.</div>`;
      }
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

  /* ---------------- Reveal / hide original ---------------- */
  feedEl.addEventListener("click", async (ev) => {
    const link = ev.target.closest(".reveal-link");
    if (!link) return;
    ev.preventDefault();

    const id = link.getAttribute("data-id") || "";
    const state = link.getAttribute("data-state") || "closed";
    const itemEl = link.closest(".item");
    if (!itemEl) return;

    const shortSpan = itemEl.querySelector('span[data-variant="short"]');
    const fullSpan = itemEl.querySelector('span[data-variant="full"]');

    if (state === "closed") {
      try {
        link.textContent = "Loading…";
        link.classList.add("is-loading");

        let fullRaw = "";
        try {
          const r = await fetch(
            `/complaints?id=${encodeURIComponent(id)}&reveal=1`,
            { cache: "no-store" }
          );
          const payload = await r.json().catch(() => ({}));
          fullRaw = extractFullText(payload);
        } catch {}

        // fallback to embedded original if API didn't provide it
        if (!fullRaw) {
          const b64 = itemEl.getAttribute("data-raw-b64") || "";
          if (b64) {
            try { fullRaw = fromB64(b64); } catch {}
          }
        }

        fullSpan.textContent = fullRaw || "(no content)";
        fullSpan.classList.remove("hidden");
        shortSpan.classList.add("hidden");

        link.textContent = "Hide original";
        link.setAttribute("data-state", "open");
      } finally {
        link.classList.remove("is-loading");
      }
    } else {
      fullSpan.classList.add("hidden");
      shortSpan.classList.remove("hidden");
      link.textContent = "Reveal original";
      link.setAttribute("data-state", "closed");
    }
  });

  /* ---------------- History link handlers ---------------- */
  olderLink?.addEventListener("click", (e) => {
    e.preventDefault();
    if (!olderLink.classList.contains("hidden")) {
      load({ append: true });
    }
  });

  newerLink?.addEventListener("click", (e) => {
    e.preventDefault();
    // reset to newest page
    cursor = null;
    hasHistory = false;
    load({ append: false });
  });

  // initial load
  load();
})();
