// public/feed.js
(() => {
  const feedEl = document.getElementById("feed");
  if (!feedEl) return;

  // ---------- CENSORING (preview only) ----------
  const BANNED_PATTERNS = [
    /\b(ni+g+e*r+|chink|sp[i1]c|k[i1]ke|raghead|g[o0]o+k)\b/gi,
    /\b(fag|f[a@]gg?o+t|dyke)\b/gi,
    /\b(fuck(?:ing|er)?|sh[i1]t|bullsh[i1]t|asshole|cunt|bitch|motherfucker)\b/gi,
    /\b(anal|blowjob|handjob|cumshot|deepthroat|xxx|porn|hentai)\b/gi,
  ];
  const ADDRESS_RE = /\b0x[a-fA-F0-9]{10,}\b/g;

  function censorForPreview(s) {
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
  const PREVIEW_LIMIT = 1000;

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

  // ---------- LOAD ----------
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
    } catch (e) {
      console.error("feed load error:", e);
      feedEl.innerHTML = `<div class="muted s">Could not load complaints.</div>`;
    }
  }

  // ---------- RENDER EACH ITEM ----------
  function renderItem(it) {
    const id = String(it.id ?? it.ID ?? it.rowid ?? "");
    const d = pickTime(it);
    const when = d ? d.toLocaleString() : "";
    const raw = pickText(it);

    // preview: censored + truncated
    const { text: censored } = censorForPreview(raw);
    const preview = truncate(censored, PREVIEW_LIMIT);

    // show toggle if censored or too long
    const needsReveal = (censored !== raw) || (raw.length > PREVIEW_LIMIT);

    // We embed the ORIGINAL as escaped HTML inside a hidden <template>
    // so clicking "Reveal original" is instant and doesn’t depend on
    // any backend route or id mismatch.
    return `
      <div class="item" data-id="${escapeHtml(id)}">
        <div class="time">${escapeHtml(when)}</div>

        <pre class="msg">
          <span data-variant="short">${escapeHtml(preview)}</span>
          <span data-variant="full" style="display:none;"></span>
        </pre>

        ${
          needsReveal
            ? `
              <a href="#" class="reveal-link" data-id="${escapeHtml(id)}" data-state="closed">
                Reveal original
              </a>
            `
            : ""
        }

        <template data-raw>${escapeHtml(raw)}</template>
      </div>
    `;
  }

  // ---------- REVEAL/COLLAPSE (event delegation) ----------
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
      // Try local raw first (no network).
      const tmpl = itemEl.querySelector("template[data-raw]");
      let fullRaw = tmpl ? tmpl.innerHTML : "";

      // Fallback to server if template missing (keeps compatibility with a /complaints?id=…&reveal=1 flow).
      if (!fullRaw) {
        try {
          link.textContent = "Loading…";
          link.classList.add("is-loading");
          const rr = await fetch(`/complaints?id=${encodeURIComponent(id)}&reveal=1`, { cache: "no-store" });
          const one = await rr.json();
          fullRaw = one?.complaint?.text ?? one?.complaint?.message ?? "";
        } catch (err) {
          console.error("reveal fetch error:", err);
        } finally {
          link.classList.remove("is-loading");
        }
      }

      // Render the ORIGINAL, uncensored text
      fullSpan.textContent = fullRaw || "(no content)";
      if (shortSpan) shortSpan.style.display = "none";
      fullSpan.style.display = "inline";
      link.textContent = "Hide original";
      link.setAttribute("data-state", "open");
      return;
    }

    // collapse
    if (state === "open") {
      if (shortSpan) shortSpan.style.display = "inline";
      if (fullSpan)  fullSpan.style.display = "none";
      link.textContent = "Reveal original";
      link.setAttribute("data-state", "closed");
    }
  });

  load();
})();
