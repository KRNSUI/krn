// public/feed.js
(() => {
  const feedEl = document.getElementById("feed");
  if (!feedEl) return;

  // ---------- CENSORING ----------
  const BANNED_PATTERNS = [
    /\b(ni+g+e*r+|chink|sp[i1]c|k[i1]ke|raghead|g[o0]o+k)\b/gi,
    /\b(fag|f[a@]gg?o+t|dyke)\b/gi,
    /\b(fuck(?:ing|er)?|sh[i1]t|bullsh[i1]t|asshole|cunt|bitch|motherfucker)\b/gi,
    /\b(anal|blowjob|handjob|cumshot|deepthroat|xxx|porn|hentai)\b/gi,
  ];
  const ADDRESS_RE = /\b0x[a-fA-F0-9]{10,}\b/g;

  function censorText(s) {
    let text = String(s || "");
    let flagged = false;

    if (ADDRESS_RE.test(text)) {
      flagged = true;
      text = text.replace(ADDRESS_RE, (m) => `${m.slice(0, 4)}…[redacted]`);
    }
    for (const re of BANNED_PATTERNS) {
      re.lastIndex = 0;
      if (re.test(text)) {
        flagged = true;
        text = text.replace(re, (m) => (m.length >= 6 ? "[censored]" : "***"));
      }
    }
    return { text: text.trim(), flagged };
  }

  // ---------- UTIL ----------
  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
  function truncate(s, n) {
    return s.length <= n ? s : s.slice(0, n) + "…";
  }
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

  // ---------- RENDER ----------
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

      const html = list.map(renderItem).join("");
      feedEl.innerHTML = html;

      // wire up toggles
      feedEl.querySelectorAll("button[data-toggle]").forEach((btn) => {
        btn.addEventListener("click", onToggle);
      });
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
    const { text: clean } = censorText(raw);
    const preview = truncate(clean, 1000);

    const sensitive = !!(it.is_sensitive ?? it.sensitive ?? it.flag_sensitive);
    const btnLabel = sensitive ? "Reveal (sensitive)" : "Show more";
    const sensAttr = sensitive ? 'data-sensitive="1"' : "";

    return `
      <div class="item" data-id="${escapeHtml(id)}">
        <div class="time">${escapeHtml(when)}</div>
        <pre class="msg">
          <span data-variant="short">${escapeHtml(preview)}</span>
          <span data-variant="full" style="display:none;"></span>
        </pre>
        <button class="toggle btn s" data-toggle data-id="${escapeHtml(id)}" ${sensAttr}>${btnLabel}</button>
      </div>
    `;
  }

  async function onToggle(ev) {
    const btn = ev.currentTarget;
    const id = btn.getAttribute("data-id") || "";
    const itemEl = btn.closest(".item");
    if (!itemEl) return;

    const shortSpan = itemEl.querySelector('span[data-variant="short"]');
    const fullSpan = itemEl.querySelector('span[data-variant="full"]');
    const isSensitive = btn.hasAttribute("data-sensitive");
    const showingShort = shortSpan && shortSpan.style.display !== "none";

    // Already fetched or non-sensitive -> just toggle
    if (!isSensitive || fullSpan?.getAttribute("data-fetched") === "1") {
      if (showingShort) {
        shortSpan.style.display = "none";
        fullSpan.style.display = "inline";
        btn.textContent = "Show less";
      } else {
        shortSpan.style.display = "inline";
        fullSpan.style.display = "none";
        btn.textContent = isSensitive ? "Reveal (sensitive)" : "Show more";
      }
      return;
    }

    // Sensitive & not fetched yet
    try {
      btn.disabled = true;
      const rr = await fetch(`/complaints?id=${encodeURIComponent(id)}&reveal=1`, {
        cache: "no-store",
      });
      const one = await rr.json();
      const fullRaw = one?.complaint?.text ?? one?.complaint?.message ?? "";
      const { text: full } = censorText(fullRaw);

      fullSpan.textContent = full;
      fullSpan.setAttribute("data-fetched", "1");

      shortSpan.style.display = "none";
      fullSpan.style.display = "inline";
      btn.textContent = "Show less";
    } catch (e) {
      console.error("reveal error:", e);
      alert("Failed to reveal.");
    } finally {
      btn.disabled = false;
    }
  }

  load();
})();
