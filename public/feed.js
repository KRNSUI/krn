// public/feed.js
(() => {
  const feedEl = document.getElementById("feed");
  if (!feedEl) return;

  // ---------- CENSORING (local copy) ----------
  const BANNED_PATTERNS = [
    /\b(ni+g+g+e*r+|chink|sp[i1]c|k[i1]ke|raghead|g[o0]o+k)\b/gi,
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
  const PREVIEW_LIMIT = 200; // tighten preview

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

  // Try common shapes from /complaints?id=&reveal=1
  function extractFullText(obj) {
    if (!obj) return "";
    if (obj.complaint?.text) return String(obj.complaint.text);
    if (obj.complaint?.message) return String(obj.complaint.message);
    if (obj.text) return String(obj.text);
    if (obj.message) return String(obj.message);
    if (obj.data?.text) return String(obj.data.text);
    if (obj.data?.message) return String(obj.data.message);
    if (obj.item?.text) return String(obj.item.text);
    if (obj.item?.message) return String(obj.item.message);
    if (typeof obj.complaint === "string") return obj.complaint;
    return "";
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
      feedEl.innerHTML = list.map(renderItem).join("");
    } catch (e) {
      console.error("feed load error:", e);
      feedEl.innerHTML = `<div class="muted s">Could not load complaints.</div>`;
    }
  }

  // ---------- RENDER EACH ITEM ----------
  function renderItem(it) {
    const id = String(it.id ?? it.ID ?? it.rowid ?? "");
    const when = (pickTime(it) || new Date()).toLocaleString();

    const raw = pickText(it);
    const { text: censored } = censorText(raw);
    const preview = truncate(censored, PREVIEW_LIMIT);
    const needsReveal = censored !== raw || raw.length > PREVIEW_LIMIT;

    // Use inline spans to avoid extra vertical space inside <pre>
    return `
      <div class="item" data-id="${$esc(id)}">
        <div class="time">${$esc(when)}</div>
        <pre class="msg">
<span data-variant="short" class="inline">${$esc(preview)}</span><span data-variant="full" class="inline hidden"></span>
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

  // ---------- REVEAL / HIDE ----------
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

        // Always set *uncensored* original
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
    fullSpan.classList.add("hidden");
    shortSpan.classList.remove("hidden");
    link.textContent = "Reveal original";
    link.setAttribute("data-state", "closed");
  });

  load();
})();
