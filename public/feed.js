// public/feed.js
import { censorText } from "./censor.js";
import { connectWallet, getAddress, payOneKRN } from "./slush.js";
import { fetchStars, postStarToggle } from "./stars.js";
import { hydrateStarCounts, initStars } from "./stars.js";


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
    if (obj.data?.text) return String(obj.data.text);
    if (obj.data?.message) return String(obj.data.message);
    return "";
  };

  /* ---------------- Inject “Older/Newer/Refresh” links ---------------- */
  const nav = document.getElementById("feed-nav") || (() => {
    const d = document.createElement("div");
    d.id = "feed-nav";
    d.className = "feed-nav";
    d.innerHTML = `
      <a href="#" id="refreshBtn" class="feed-link">⟳ Refresh</a>
      <a href="#" id="newer-link" class="feed-link hidden">← Newer</a>
      <a href="#" id="older-link" class="feed-link">Older →</a>
    `;
    feedEl.insertAdjacentElement("afterend", d);
    return d;
  })();
  const refreshLink = nav.querySelector("#refreshBtn");
  const olderLink = nav.querySelector("#older-link");
  const newerLink = nav.querySelector("#newer-link");

  if (!document.getElementById("feed-nav-inline-style")) {
    const style = document.createElement("style");
    style.id = "feed-nav-inline-style";
    style.textContent = `
      .feed-link{display:inline-block;margin:.5rem .75rem;font-size:.9rem;color:var(--accent);text-decoration:none;opacity:.9;cursor:pointer}
      .feed-link:hover{text-decoration:underline;opacity:1}
      .feed-link.hidden{display:none}
      .feed-link.is-loading{pointer-events:none;opacity:.6}
      .stars{margin-top:.25rem;display:inline-flex;align-items:center;gap:.4rem}
      .star-toggle{display:inline-block;text-decoration:none;font-weight:700}
      .star-toggle[aria-pressed="true"]{filter:brightness(1.2)}
      .star-count{opacity:.85;font-variant-numeric:tabular-nums}
    `;
    document.head.appendChild(style);
  }

  /* ---------------- Paging state ---------------- */
  let cursor = null;      // created_at of last visible item
  let hasHistory = false; // whether we've paged older at least once
  let isLoading = false;

  /* ---------------- Load feed (supports append + cursor) ---------------- */
  async function load({ append = false } = {}) {
    try {
      isLoading = true;
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
        olderLink?.classList.add("hidden");
        return;
      }

      const html = list.map(renderItem).join("");
      if (append) {
        feedEl.insertAdjacentHTML("beforeend", html);
        hasHistory = true;
      } else {
        feedEl.innerHTML = html;
          await hydrateStarCounts(feedEl);
          initStars(feedEl);
        hasHistory = false;
      }

      // update stars for everything currently in DOM
      await refreshStarsInView();
      
      // Also check which posts the current user has starred
      try {
        const { hydrateUserStarStates } = await import("./stars.js");
        await hydrateUserStarStates(feedEl);
      } catch (error) {
        console.warn("Could not hydrate user star states:", error);
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
      if (olderLink) olderLink.classList.toggle("hidden", list.length < FETCH_LIMIT);
      if (newerLink) newerLink.classList.toggle("hidden", !hasHistory);
    } catch (e) {
      console.error("feed load error:", e);
      if (!append) {
        feedEl.innerHTML = `<div class="muted s">Could not load complaints.</div>`;
      }
    } finally {
      isLoading = false;
    }
  }

/* ---------------- Render each item ---------------- */
function renderItem(it) {
  const id   = String(it.id ?? it.ID ?? it.rowid ?? "");
  const when = (pickTime(it) || new Date()).toLocaleString();

  const raw    = pickText(it);
  const rawB64 = toB64(raw);

  const { text: censored } = censorText(raw);
  const preview     = twoLinePreview(censored);
  const needsReveal = (censored !== raw) || (raw.split(/\r?\n/).length > 2);

  return `
    <div class="item" data-id="${$esc(id)}" data-raw-b64="${$esc(rawB64)}">
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

      <!-- Stars UI with proper star toggle button -->
      <div class="stars">
        <button type="button" 
                class="star-toggle" 
                data-id="${$esc(id)}" 
                data-dir="up" 
                aria-pressed="false"
                title="Star this post (costs 2 KRN)">
          ★
        </button>
        <span class="star-count" data-id="${$esc(id)}">0</span>
      </div>
    </div>
  `;
}

  /* ---------------- Reveal / hide original (event delegation) ---------------- */
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

        let fullRaw = "";
        try {
          const r = await fetch(`/complaints?id=${encodeURIComponent(id)}&reveal=1`, { cache: "no-store" });
          const payload = await r.json().catch(() => ({}));
          fullRaw = extractFullText(payload);
        } catch {}

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

  /* ---------------- Stars: load counts for visible items ---------------- */
async function refreshStarsInView() {
  try {
    // gather IDs currently rendered
    const ids = Array.from(document.querySelectorAll('#feed .item'))
      .map(el => el.getAttribute('data-id'))
      .filter(Boolean);

    if (!ids.length) return;

    // IMPORTANT: await + try/catch (no .catch chaining)
    const counts = await fetchStars(ids); // { [postId]: number }

    // update each visible row
    for (const el of document.querySelectorAll('#feed .item')) {
      const id = el.getAttribute('data-id');
      if (!id) continue;
      const n = counts[id];
      const countEl = el.querySelector('[data-star-count]');
      if (countEl && typeof n === 'number') {
        countEl.textContent = String(n);
      }
    }
  } catch (err) {
    console.warn('refreshStarsInView error:', err);
  }
}


  /* ---------------- Stars: toggle handler ---------------- */
  feedEl.addEventListener('click', async (ev) => {
  const btn = ev.target.closest('[data-star-btn]');
  if (!btn) return;

  ev.preventDefault();

  const itemEl = btn.closest('.item');
  const postId = itemEl?.getAttribute('data-id');
  if (!postId) return;

  const dir = btn.getAttribute('data-dir') || 'up'; // keep your current API
  const countEl = itemEl.querySelector('[data-star-count]');

  btn.setAttribute('aria-busy', 'true');
  btn.disabled = true;

  try {
    // IMPORTANT: await + try/catch (no .catch chaining)
    const res = await postStarToggle(postId, dir); // { ok, count } in no-pay mode
    if (res && typeof res.count === 'number' && countEl) {
      countEl.textContent = String(res.count);
    }
  } catch (err) {
    console.error('star toggle error:', err);
    alert('Could not process star. Please try again.');
  } finally {
    btn.disabled = false;
    btn.removeAttribute('aria-busy');
  }
});

  /* ---------------- History link handlers ---------------- */
  olderLink?.addEventListener("click", (e) => {
    e.preventDefault();
    if (isLoading || olderLink.classList.contains("hidden")) return;
    load({ append: true });
  });

  newerLink?.addEventListener("click", (e) => {
    e.preventDefault();
    if (isLoading) return;
    cursor = null;
    hasHistory = false;
    load({ append: false });
  });

  /* ---------------- Refresh handler ---------------- */
  refreshLink?.addEventListener("click", (e) => {
    e.preventDefault();
    if (isLoading) return;
    refreshLink.classList.add("is-loading");
    const oldText = refreshLink.textContent;
    refreshLink.textContent = "Refreshing…";
    cursor = null;
    hasHistory = false;
    load({ append: false }).finally(() => {
      refreshLink.classList.remove("is-loading");
      refreshLink.textContent = oldText || "⟳ Refresh";
    });
  });

  // initial load
  load();
})();
