// public/feed.js
(() => {
  const feedEl = document.getElementById("feed");
  if (!feedEl) return;

  // ---- CENSOR / SANITIZE ----
  // Minimal blocklist (extend to suit your policy)
  const BANNED_PATTERNS = [
    // slurs / harassment (examples; adjust as needed)
    /\b(ni+g+e*r+|chink|sp[i1]c|k[i1]ke|raghead|g[o0]o+k)\b/gi,
    /\b(fag|f[a@]gg?o+t|dyke)\b/gi,

    // profanity (examples; adjust)
    /\b(fuck(?:ing|er)?|sh[i1]t|bullsh[i1]t|asshole|cunt|bitch|motherfucker)\b/gi,

    // explicit sexual terms (examples)
    /\b(anal|blowjob|handjob|cumshot|deepthroat|xxx|porn|hentai)\b/gi,
  ];

  // redact any long hex-ish address (prevents doxing/piling-on)
  const ADDRESS_RE = /\b0x[a-fA-F0-9]{10,}\b/g;

  function censorText(input) {
    if (!input || typeof input !== "string") return { text: "", flagged: false };
    let out = input;
    let flagged = false;

    if (ADDRESS_RE.test(out)) {
      flagged = true;
      out = out.replace(ADDRESS_RE, (m) => `${m.slice(0, 4)}…[redacted]`);
    }
    for (const re of BANNED_PATTERNS) {
      re.lastIndex = 0;
      if (re.test(out)) {
        flagged = true;
        out = out.replace(re, (m) => (m.length >= 6 ? "[censored]" : "***"));
      }
    }
    return { text: out.trim(), flagged };
  }

  // ---- UTIL ----
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

  function formatTime(iso) {
    try {
      const d = new Date(iso);
      if (!Number.isFinite(d.getTime())) return iso || "";
      return d.toLocaleString();
    } catch {
      return iso || "";
    }
  }

  // ---- RENDER ----
  async function load() {
    try {
      const r = await fetch("/complaints?limit=120", { cache: "no-store" });
      const data = await r.json();
      if (!data.ok) throw new Error(data.error || "Failed to load complaints");

      const items = Array.isArray(data.items) ? data.items : [];
      if (!items.length) {
        feedEl.innerHTML = `<div class="muted s">No complaints yet.</div>`;
        return;
      }

      // Build HTML (safe: we only inject text in content nodes)
      const html = items.map(renderItem).join("");
      feedEl.innerHTML = html;

      // Wire up all toggles
      feedEl.querySelectorAll("button[data-toggle]").forEach((btn) => {
        btn.addEventListener("click", onToggle);
      });
    } catch (e) {
      console.error(e);
      feedEl.innerHTML = `<div class="muted s">Could not load complaints.</div>`;
    }
  }

  function renderItem(it) {
    // Censor client-side (belt-and-suspenders in case legacy rows exist)
    const raw = String(it.text || "");
    const { text: clean } = censorText(raw);

    const preview = truncate(clean, 1000);
    const time = escapeHtml(formatTime(it.created_at));
    const id = String(it.id);

    // Sensitive items: first toggle will fetch full via /complaints?id=...&reveal=1
    const sensitiveAttr = it.is_sensitive ? 'data-sensitive="1"' : "";
    const btnLabel = it.is_sensitive ? "Reveal (sensitive)" : "Show more";

    return `
      <div class="item" data-id="${id}">
        <div class="time">${time}</div>
        <pre class="msg">
          <span data-variant="short">${escapeHtml(preview)}</span>
          <span data-variant="full" style="display:none;"></span>
        </pre>
        <button class="toggle btn s" data-toggle data-id="${id}" ${sensitiveAttr}>${btnLabel}</button>
      </div>
    `;
  }

  async function onToggle(ev) {
    const btn = ev.currentTarget;
    const id = btn.getAttribute("data-id") || "";
    const isSensitive = btn.hasAttribute("data-sensitive");

    const itemEl = btn.closest(".item");
    if (!itemEl) return;

    const shortSpan = itemEl.querySelector('span[data-variant="short"]');
    const fullSpan = itemEl.querySelector('span[data-variant="full"]');

    const showingShort = shortSpan && shortSpan.style.display !== "none";

    // If already fetched (or not sensitive), just toggle
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

    // Sensitive and not fetched yet: pull full text via reveal
    try {
      btn.disabled = true;
      const rr = await fetch(`/complaints?id=${encodeURIComponent(id)}&reveal=1`, {
        cache: "no-store",
      });
      const one = await rr.json();

      // Expect: { ok: true, complaint: { text: "...", created_at: "...", ... } }
      const full = String(one?.complaint?.text || "");
      const { text: cleanFull } = censorText(full);

      fullSpan.textContent = cleanFull;
      fullSpan.setAttribute("data-fetched", "1");

      // Now reveal
      shortSpan.style.display = "none";
      fullSpan.style.display = "inline";
      btn.textContent = "Show less";
    } catch (e) {
      console.error(e);
      alert("Failed to reveal.");
    } finally {
      btn.disabled = false;
    }
  }

  load();
})();
