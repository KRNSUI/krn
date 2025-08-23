// public/chart.js
(function () {
  const COLORS = {
    bg: "#0d0a07",
    frame: "rgba(255,174,66,0.25)",
    grid: "rgba(255,174,66,0.15)",
    line: "#ff8c00",
    glow: "rgba(255,140,0,0.35)",
    text: "#fbead1",
    muted: "rgba(255,255,255,0.7)"
  };

  document.addEventListener("DOMContentLoaded", () => {
    hydrateDetails();
    drawPrice();
  });

  /* ---------- DETAILS: coin + metadata ---------- */

  async function hydrateDetails() {
    try {
      const [coinRes, metaRes] = await Promise.all([
        fetch("/bb?mode=coin"),
        fetch("/bb?mode=metadata"),
      ]);

      const coin = await coinRes.json();
      const meta = await metaRes.json();

      const el = document.getElementById("coinDetails");
      if (!el) return;

      if (!coin.ok) {
        el.innerHTML = `<div class="muted s">Error loading coin: ${escapeHtml(coin.error || "unknown")}</div>`;
        return;
      }

      const c = coin.data || {};
      const m = meta.ok ? (meta.data || {}) : {};

      // Pick common fields if present; fall back safely.
      const symbol = c.symbol || m.symbol || "KRN";
      const name = c.name || m.name || "KRN";
      const supply = c.totalSupply || c.supply || m.totalSupply || null;
      const holders = c.holders || m.holders || null;
      const price = m.price ?? m.lastPrice ?? m.marketPrice ?? null;
      const mc = m.marketCap ?? m.market_cap ?? null;

      el.innerHTML = `
        <ul class="s" style="list-style:none;padding:0;margin:0">
          <li><strong>${escapeHtml(name)}</strong> <span class="muted">(${escapeHtml(symbol)})</span></li>
          ${price != null ? `<li>Price: <strong>${fmtNum(price)}</strong></li>` : ``}
          ${mc != null ? `<li>Market Cap: <strong>${fmtNum(mc)}</strong></li>` : ``}
          ${supply != null ? `<li>Total Supply: <strong>${fmtNum(supply)}</strong></li>` : ``}
          ${holders != null ? `<li>Holders: <strong>${fmtNum(holders)}</strong></li>` : ``}
        </ul>
      `;
    } catch (e) {
      const el = document.getElementById("coinDetails");
      if (el) el.innerHTML = `<div class="muted s">Error: ${escapeHtml(String(e))}</div>`;
    }
  }

  /* ---------- PRICE CHART (best-effort) ---------- */

  async function drawPrice() {
    const canvas = document.getElementById("priceChart");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    sizeCanvas(canvas, ctx);

    let payload;
    try {
      const res = await fetch("/bb?mode=priceHistory");
      payload = await res.json();
    } catch (e) {
      return drawError(canvas, ctx, `Fetch failed: ${e.message}`);
    }

    if (!payload.ok) {
      return drawError(canvas, ctx, payload.error || "No price history");
    }

    const labels = payload.labels || [];
    const series = (payload.series || []).map(Number).filter(n => Number.isFinite(n));
    if (!labels.length || !series.length) {
      return drawError(canvas, ctx, "No price history available");
    }

    renderLine(canvas, ctx, labels, series);
    window.addEventListener("resize", () => {
      sizeCanvas(canvas, ctx);
      renderLine(canvas, ctx, labels, series);
    });
  }

  function renderLine(canvas, ctx, labels, series) {
    const box = canvas.getBoundingClientRect();
    const W = box.width, H = box.height;

    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, W, H);

    const PAD = { l: 44, r: 16, t: 18, b: 28 };
    const innerW = W - PAD.l - PAD.r;
    const innerH = H - PAD.t - PAD.b;

    const n = series.length;
    const x = (i) => PAD.l + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);

    const min = Math.min(...series);
    const max = Math.max(...series);
    const span = Math.max(1e-12, max - min);
    const y = (v) => PAD.t + innerH - ((v - min) / span) * innerH;

    // frame
    ctx.strokeStyle = COLORS.frame;
    ctx.strokeRect(PAD.l, PAD.t, innerW, innerH);

    // grid
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    const rows = 4;
    for (let i = 1; i < rows; i++) {
      const gy = PAD.t + (i / rows) * innerH;
      ctx.moveTo(PAD.l, gy); ctx.lineTo(PAD.l + innerW, gy);
    }
    ctx.stroke();

    // glow
    ctx.save();
    ctx.shadowColor = COLORS.glow;
    ctx.shadowBlur = 12;
    strokeLine(ctx, series, x, y, "#0000"); // shadow only
    ctx.restore();

    // main line
    strokeLine(ctx, series, x, y, COLORS.line, 2.2);

    // axis labels
    ctx.fillStyle = COLORS.text;
    ctx.font = "12px system-ui, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(fmtNum(min), PAD.l - 6, H - PAD.b + 4);
    ctx.fillText(fmtNum(max), PAD.l - 6, PAD.t + 4);

    // x ticks (first/middle/last)
    ctx.fillStyle = COLORS.muted;
    ctx.textAlign = "center";
    const marks = [0, Math.floor((n - 1) / 2), n - 1].filter((v, i, a) => a.indexOf(v) === i && v >= 0);
    for (const i of marks) {
      const d = new Date(labels[i]);
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      ctx.fillText(`${hh}:${mm}`, x(i), H - 8);
    }
  }

  function strokeLine(ctx, series, x, y, color, width = 2) {
    ctx.beginPath();
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    for (let i = 0; i < series.length; i++) {
      const px = x(i), py = y(series[i]);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }

  function sizeCanvas(canvas, ctx) {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const box = canvas.getBoundingClientRect();
    canvas.width = Math.round(box.width * dpr);
    canvas.height = Math.round(box.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawError(canvas, ctx, msg) {
    const box = canvas.getBoundingClientRect();
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, box.width, box.height);
    ctx.fillStyle = COLORS.muted;
    ctx.font = "13px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(msg), box.width / 2, box.height / 2);
  }

  function fmtNum(n) {
    if (n == null || Number.isNaN(Number(n))) return "-";
    const v = Number(n);
    if (v >= 1_000_000_000) return (v / 1_000_000_000).toFixed(2) + "B";
    if (v >= 1_000_000) return (v / 1_000_000).toFixed(2) + "M";
    if (v >= 1_000) return (v / 1_000).toFixed(2) + "K";
    return v.toString();
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[c]));
  }
})();
