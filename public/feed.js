// /public/feed.js  (ES module)
import { censorText } from '/public/censor.js';

(() => {
  const feedEl = document.getElementById('feed');
  if (!feedEl) return;

  // ---------- CONFIG ----------
  const PREVIEW_LINES = 2; // show first 2 logical lines, then reveal

  // ---------- HELPERS ----------
  const $esc = (s) =>
    String(s ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');

  function pickTime(it) {
    const v =
      it.created_at ??
      it.createdAt ??
      it.created ??
      it.time ??
      it.timestamp;
    const d = v ? new Date(v) : new Date(NaN);
    return Number.isFinite(d.getTime()) ? d : null;
  }

  function pickText(it) {
    return it.text ?? it.message ?? '';
  }

  function normalizeList(payload) {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.results)) return payload.results;
    if (Array.isArray(payload?.rows)) return payload.rows;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
  }

  // Be generous in what we accept from /complaints?id=…&reveal=1
  function extractFullText(obj) {
    if (!obj || typeof obj !== 'object') return '';
    if (typeof obj.complaint === 'string') return obj.complaint;
    if (obj.complaint?.text) return String(obj.complaint.text);
    if (obj.complaint?.message) return String(obj.complaint.message);
    if (obj.text) return String(obj.text);
    if (obj.message) return String(obj.message);
    if (obj.data?.text) return String(obj.data.text);
    if (obj.data?.message) return String(obj.data.message);
    if (obj.item?.text) return String(obj.item.text);
    if (obj.item?.message) return String(obj.item.message);
    return '';
  }

  function firstNLines(str, n) {
    // Logical split on newlines; join max N lines
    const lines = String(str ?? '').split(/\r?\n/);
    return { preview: lines.slice(0, n).join('\n'), totalLines: lines.length };
  }

  // ---------- LOAD ----------
  async function load() {
    try {
      const res = await fetch('/complaints?limit=120', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const list = normalizeList(json);

      if (!list.length) {
        feedEl.innerHTML = `<div class="muted s">No complaints yet.</div>`;
        return;
      }

      feedEl.innerHTML = list.map(renderItem).join('');
    } catch (e) {
      console.error('feed load error:', e);
      feedEl.innerHTML = `<div class="muted s">Could not load complaints.</div>`;
    }
  }

  // ---------- RENDER ----------
  function renderItem(it) {
    const id = String(it.id ?? it.ID ?? it.rowid ?? '');
    const when = (pickTime(it) || new Date()).toLocaleString();

    const raw = pickText(it);
    const { text: censored } = censorText(raw);

    const { preview, totalLines } = firstNLines(censored, PREVIEW_LINES);
    const needsReveal =
      censored !== raw || totalLines > PREVIEW_LINES;

    // Items without reveal are extra-compact via .compact class
    const itemClass = `item${needsReveal ? '' : ' compact'}`;

    return `
      <div class="${itemClass}" data-id="${$esc(id)}">
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
            : ''
        }
      </div>
    `;
  }

  // ---------- REVEAL/HIDE (event delegation) ----------
  feedEl.addEventListener('click', async (ev) => {
    const link = ev.target.closest('.reveal-link');
    if (!link) return;
    ev.preventDefault();

    const id = link.getAttribute('data-id') || '';
    const state = link.getAttribute('data-state') || 'closed';
    const itemEl = link.closest('.item');
    if (!itemEl) return;

    const shortSpan = itemEl.querySelector('span[data-variant="short"]');
    const fullSpan = itemEl.querySelector('span[data-variant="full"]');

    if (state === 'closed') {
      try {
        link.textContent = 'Loading…';
        link.classList.add('is-loading');

        const r = await fetch(
          `/complaints?id=${encodeURIComponent(id)}&reveal=1`,
          { cache: 'no-store' }
        );
        const payload = await r.json();
        let fullRaw = extractFullText(payload);

        // If your endpoint returns empty string for some reason,
        // show a clear placeholder instead of "(no content)" everywhere.
        if (!fullRaw) fullRaw = '(no content)';

        fullSpan.textContent = fullRaw; // UNCENSORED original per your requirement
        fullSpan.classList.remove('hidden');
        shortSpan.classList.add('hidden');
        link.textContent = 'Hide original';
        link.setAttribute('data-state', 'open');
      } catch (err) {
        console.error('reveal error:', err);
        link.textContent = 'Reveal original';
        alert('Failed to reveal.');
      } finally {
        link.classList.remove('is-loading');
      }
      return;
    }

    // collapse
    fullSpan.classList.add('hidden');
    shortSpan.classList.remove('hidden');
    link.textContent = 'Reveal original';
    link.setAttribute('data-state', 'closed');
  });

  load();
})();
