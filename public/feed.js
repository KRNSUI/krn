const feed = document.getElementById('feed');
const esc = (s) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

async function loadFeed() {
  try {
    const r = await fetch('/complaints', { headers: { accept: 'application/json' }});
    if (!r.ok) throw new Error('load failed');
    const rows = await r.json();
    if (!rows.length) { feed.innerHTML = '<div class="muted s">No complaints yet.</div>'; return; }
    feed.innerHTML = rows.map(r => `
      <article class="item">
        <div class="time">${new Date(r.created_at).toLocaleString()}</div>
        <div class="msg">${esc(r.message)}</div>
      </article>
    `).join('');
  } catch { feed.innerHTML = '<div class="muted s">Could not load complaints.</div>'; }
}
document.addEventListener('DOMContentLoaded', loadFeed);
