// Enhanced Feed Utility with full CRUD operations
// Supports pagination, stars, flags, and user interactions

import { censorText } from "./censor.js";
import { connectWallet, getAddress } from "../../systems/wallet/slush.js";

function initEnhancedFeed(containerId = "feed") {
  const feedEl = document.getElementById(containerId);
  if (!feedEl) return null;

  /* ---------------- Configuration ---------------- */
  const FETCH_LIMIT = 50;
  const API_BASE = "/complaints_enhanced";

  /* ---------------- State Management ---------------- */
  let cursor = null;
  let hasHistory = false;
  let isLoading = false;
  let currentUserAddr = null;

  /* ---------------- Utility Functions ---------------- */
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
    const v = it.created_at ?? it.createdAt ?? it.created ?? it.time ?? it.timestamp;
    const d = v ? new Date(v) : new Date(NaN);
    return Number.isFinite(d.getTime()) ? d : null;
  };

  const pickText = (it) => it.text ?? it.message ?? "";

  /* ---------------- Navigation UI ---------------- */
  const nav = document.getElementById("feed-nav") || (() => {
    const d = document.createElement("div");
    d.id = "feed-nav";
    d.className = "feed-nav";
    d.innerHTML = `
      <div class="feed-controls">
        <a href="#" id="refreshBtn" class="feed-link">⟳ Refresh</a>
        <a href="#" id="newer-link" class="feed-link hidden">← Newer</a>
        <a href="#" id="older-link" class="feed-link">Older →</a>
      </div>
      <div class="feed-sort">
        <select id="sortSelect" class="sort-select">
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="most_starred">Most Starred</option>
          <option value="most_flagged">Most Flagged</option>
        </select>
        <label class="show-flagged">
          <input type="checkbox" id="showFlaggedCheckbox">
          Show Flagged
        </label>
      </div>
    `;
    feedEl.insertAdjacentElement("afterend", d);
    return d;
  })();

  const refreshLink = nav.querySelector("#refreshBtn");
  const olderLink = nav.querySelector("#older-link");
  const newerLink = nav.querySelector("#newer-link");
  const sortSelect = nav.querySelector("#sortSelect");
  const showFlaggedCheckbox = nav.querySelector("#showFlaggedCheckbox");

  /* ---------------- Styles ---------------- */
  if (!document.getElementById("feed-enhanced-styles")) {
    const style = document.createElement("style");
    style.id = "feed-enhanced-styles";
    style.textContent = `
      .feed-nav {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin: 1rem 0;
        padding: 0.5rem;
        background: var(--card);
        border-radius: 8px;
        border: 1px solid var(--edge);
      }
      
      .feed-controls {
        display: flex;
        gap: 0.5rem;
      }
      
      .feed-sort {
        display: flex;
        align-items: center;
        gap: 1rem;
      }
      
      .feed-link {
        display: inline-block;
        margin: 0.25rem 0.5rem;
        font-size: 0.9rem;
        color: var(--accent);
        text-decoration: none;
        opacity: 0.9;
        cursor: pointer;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        transition: all 0.2s;
      }
      
      .feed-link:hover {
        text-decoration: underline;
        opacity: 1;
        background: rgba(255, 106, 0, 0.1);
      }
      
      .feed-link.hidden {
        display: none;
      }
      
      .feed-link.is-loading {
        pointer-events: none;
        opacity: 0.6;
      }
      
      .sort-select {
        background: var(--bg);
        color: var(--fg);
        border: 1px solid var(--edge);
        border-radius: 4px;
        padding: 0.25rem 0.5rem;
        font-size: 0.9rem;
      }
      
      .show-flagged {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.9rem;
        color: var(--muted);
      }
      
      .show-flagged input[type="checkbox"] {
        accent-color: var(--accent);
      }
      
      .item {
        background: var(--card);
        border: 1px solid var(--edge);
        border-radius: 8px;
        padding: 1rem;
        margin-bottom: 1rem;
        transition: all 0.2s;
      }
      
      .item:hover {
        box-shadow: var(--glow);
      }
      
      .item.flagged {
        border-color: #ff4444;
        background: rgba(255, 68, 68, 0.1);
      }
      
      .item-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
      }
      
      .item-time {
        font-size: 0.8rem;
        color: var(--muted);
      }
      
      .item-author {
        font-size: 0.8rem;
        color: var(--accent);
        font-family: monospace;
      }
      
      .item-content {
        margin-bottom: 1rem;
        line-height: 1.5;
        white-space: pre-wrap;
        word-wrap: break-word;
      }
      
      .item-actions {
        display: flex;
        gap: 1rem;
        align-items: center;
      }
      
      .action-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.25rem 0.5rem;
        border: 1px solid var(--edge);
        border-radius: 4px;
        background: transparent;
        color: var(--fg);
        cursor: pointer;
        font-size: 0.8rem;
        transition: all 0.2s;
      }
      
      .action-btn:hover {
        background: var(--accent);
        color: var(--bg);
        border-color: var(--accent);
      }
      
      .action-btn.active {
        background: var(--accent);
        color: var(--bg);
        border-color: var(--accent);
      }
      
      .action-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      
      .action-count {
        font-variant-numeric: tabular-nums;
        font-weight: bold;
      }
      
      .star-btn {
        color: #ffd700;
      }
      
      .flag-btn {
        color: #ff4444;
      }
      
      .reveal-link {
        color: var(--accent);
        text-decoration: none;
        font-size: 0.9rem;
        cursor: pointer;
      }
      
      .reveal-link:hover {
        text-decoration: underline;
      }
      
      .reveal-link.is-loading {
        pointer-events: none;
        opacity: 0.6;
      }
    `;
    document.head.appendChild(style);
  }

  /* ---------------- Load Feed ---------------- */
  async function load({ append = false, resetCursor = false } = {}) {
    try {
      isLoading = true;
      
      // Get current user address
      try {
        currentUserAddr = getAddress();
      } catch (e) {
        currentUserAddr = null;
      }

      const url = new URL(API_BASE, location.origin);
      url.searchParams.set("limit", String(FETCH_LIMIT));
      
      if (append && cursor && !resetCursor) {
        url.searchParams.set("before", cursor);
      }
      
      const sort = sortSelect?.value || "newest";
      const showFlagged = showFlaggedCheckbox?.checked || false;
      
      url.searchParams.set("sort", sort);
      if (showFlagged) {
        url.searchParams.set("show_flagged", "true");
      }
      
      if (currentUserAddr) {
        url.searchParams.set("user_addr", currentUserAddr);
      }

      const res = await fetch(url.toString(), { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const data = await res.json();
      const complaints = data.complaints || [];

      if (!complaints.length) {
        if (!append) {
          feedEl.innerHTML = `<div class="muted">No complaints found.</div>`;
        }
        olderLink?.classList.add("hidden");
        return;
      }

      const html = complaints.map(renderComplaint).join("");
      
      if (append) {
        feedEl.insertAdjacentHTML("beforeend", html);
        hasHistory = true;
      } else {
        feedEl.innerHTML = html;
        hasHistory = false;
      }

      // Update cursor
      const lastItem = complaints[complaints.length - 1];
      cursor = lastItem?.created_at || null;

      // Update navigation
      if (olderLink) {
        olderLink.classList.toggle("hidden", !data.pagination?.has_more);
      }
      if (newerLink) {
        newerLink.classList.toggle("hidden", !hasHistory);
      }

    } catch (e) {
      console.error("feed load error:", e);
      if (!append) {
        feedEl.innerHTML = `<div class="muted">Could not load complaints.</div>`;
      }
    } finally {
      isLoading = false;
    }
  }

  /* ---------------- Render Complaint ---------------- */
  function renderComplaint(complaint) {
    const id = String(complaint.id);
    const when = (pickTime(complaint) || new Date()).toLocaleString();
    const raw = pickText(complaint);
    const rawB64 = toB64(raw);
    const { text: censored } = censorText(raw);
    const preview = twoLinePreview(censored);
    const needsReveal = (censored !== raw) || (raw.split(/\r?\n/).length > 2);
    const isFlagged = complaint.is_flagged;
    const userStarred = complaint.user_starred;
    const userFlagged = complaint.user_flagged;

    return `
      <div class="item ${isFlagged ? 'flagged' : ''}" data-id="${$esc(id)}" data-raw-b64="${$esc(rawB64)}">
        <div class="item-header">
          <div class="item-time">${$esc(when)}</div>
          ${complaint.author_addr ? `<div class="item-author">${$esc(complaint.author_addr)}</div>` : ''}
        </div>
        
        <div class="item-content">
          <span data-variant="short" class="inline">${$esc(preview)}</span>
          <span data-variant="full" class="inline hidden"></span>
          ${needsReveal ? `<br><a href="#" class="reveal-link" data-id="${$esc(id)}" data-state="closed">Reveal original</a>` : ''}
        </div>
        
        <div class="item-actions">
          <button type="button" 
                  class="action-btn star-btn ${userStarred ? 'active' : ''}" 
                  data-action="star" 
                  data-id="${$esc(id)}"
                  title="${userStarred ? 'Remove star' : 'Star this complaint'}">
            ★ <span class="action-count" data-star-count="${$esc(id)}">${complaint.star_count || 0}</span>
          </button>
          
          <button type="button" 
                  class="action-btn flag-btn ${userFlagged ? 'active' : ''}" 
                  data-action="flag" 
                  data-id="${$esc(id)}"
                  title="${userFlagged ? 'Remove flag' : 'Flag this complaint'}">
            ⚑ <span class="action-count" data-flag-count="${$esc(id)}">${complaint.flag_count || 0}</span>
          </button>
        </div>
      </div>
    `;
  }

  /* ---------------- Event Handlers ---------------- */
  
  // Reveal/hide original content
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
          const url = new URL(`${API_BASE}`, location.origin);
          url.searchParams.set("id", id);
          url.searchParams.set("reveal", "1");
          if (currentUserAddr) {
            url.searchParams.set("user_addr", currentUserAddr);
          }
          
          const r = await fetch(url.toString(), { cache: "no-store" });
          const payload = await r.json().catch(() => ({}));
          fullRaw = payload.complaint?.message || "";
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

  // Star/Flag actions
  feedEl.addEventListener("click", async (ev) => {
    const btn = ev.target.closest(".action-btn");
    if (!btn) return;
    ev.preventDefault();

    const action = btn.getAttribute("data-action");
    const id = btn.getAttribute("data-id");
    if (!action || !id) return;

    const isActive = btn.classList.contains("active");
    const actualAction = isActive ? `un${action}` : action;

    btn.disabled = true;

    try {
      // Ensure wallet is connected for paid actions
      if (!currentUserAddr) {
        try {
          const connected = await connectWallet();
          if (connected) {
            currentUserAddr = getAddress();
          } else {
            throw new Error("Wallet connection required");
          }
        } catch (e) {
          alert("Please connect your wallet to perform this action.");
          return;
        }
      }

      const res = await fetch(API_BASE, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: actualAction,
          complaintId: id,
          userAddr: currentUserAddr
        })
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const data = await res.json();
      
      if (data.ok) {
        // Update button state
        btn.classList.toggle("active", data[`user_${action}`]);
        btn.title = data[`user_${action}`] ? `Remove ${action}` : `${action} this complaint`;
        
        // Update counts
        const starCountEl = btn.querySelector(`[data-star-count="${id}"]`);
        const flagCountEl = btn.querySelector(`[data-flag-count="${id}"]`);
        
        if (starCountEl) starCountEl.textContent = data.star_count;
        if (flagCountEl) flagCountEl.textContent = data.flag_count;
        
        // Show success message
        if (data.message) {
          console.log(data.message);
        }
      }
    } catch (e) {
      console.error(`${action} error:`, e);
      alert(`Could not ${action} complaint. Please try again.`);
    } finally {
      btn.disabled = false;
    }
  });

  // Navigation handlers
  olderLink?.addEventListener("click", (e) => {
    e.preventDefault();
    if (isLoading || olderLink.classList.contains("hidden")) return;
    load({ append: true });
  });

  newerLink?.addEventListener("click", (e) => {
    e.preventDefault();
    if (isLoading) return;
    load({ append: false, resetCursor: true });
  });

  refreshLink?.addEventListener("click", (e) => {
    e.preventDefault();
    if (isLoading) return;
    refreshLink.classList.add("is-loading");
    const oldText = refreshLink.textContent;
    refreshLink.textContent = "Refreshing…";
    load({ append: false, resetCursor: true }).finally(() => {
      refreshLink.classList.remove("is-loading");
      refreshLink.textContent = oldText || "⟳ Refresh";
    });
  });

  // Sort and filter handlers
  sortSelect?.addEventListener("change", () => {
    if (isLoading) return;
    load({ append: false, resetCursor: true });
  });

  showFlaggedCheckbox?.addEventListener("change", () => {
    if (isLoading) return;
    load({ append: false, resetCursor: true });
  });

  // Initial load
  load();
  
  // Return control functions
  return { 
    load, 
    refresh: () => load({ append: false, resetCursor: true }),
    getUserAddr: () => currentUserAddr
  };
}

// Auto-init when imported
if (typeof document !== 'undefined') {
  document.addEventListener("DOMContentLoaded", () => {
    initEnhancedFeed();
  });
}

export default initEnhancedFeed;
