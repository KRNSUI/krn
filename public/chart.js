(async function () {
  const COIN =
    "0x278c12e3bcc279248ea3e316ca837244c3941399f2bf4598638f4a8be35c09aa::krn::KRN";

  const el = document.getElementById("krnChart");
  if (!el || !el.getContext) return;
  const ctx = el.getContext("2d");

  // DPI scaling for crispness
  const ratio = window.devicePixelRatio || 1;
  const W = el.clientWidth || 800;
  const H = el.clientHeight || 240;
  el.width = Math.floor(W * ratio);
  el.height = Math.floor(H * ratio);
  ctx.scale(ratio, ratio);

  // fetch time-series (server-proxied)
let data;
try {
  const res = await fetch(`/chain-txs?coinType=${encodeURIComponent(COIN)}&limit=400`, { cache: "no-store" });
  data = await res.json();
  if (!res.ok) throw new Error(`Upstream ${data.upstreamStatus || res.status}: ${data.error || "unknown"}`);
  if (!data || !Array.isArray(data.points)) throw new Error("Bad data");
} catch (e) {
  drawError(ctx, W, H, e);
  return;
}

  const points = data.points;
  const values = points.map(p => p.c);
  const times = points.map(p => p.t);
  const minV = 0;
  const maxV = Math.max(1, Math.max(...values)); // avoid flatline divide-by-zero

  // padding & axes
  const padL = 42, padR = 16, padT = 18, padB = 28;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  // helpers
  const xAt = (i) => padL + (i / Math.max(1, points.length - 1)) * innerW;
  const yAt = (v) => padT + (1 - (v - minV) / Math.max(1, maxV - minV)) * innerH;

  // clear
  ctx.clearRect(0, 0, W, H);

  // bg
  ctx.fillStyle = getCss("--card", "#1c120b");
  ctx.fillRect(0, 0, W, H);

  // axes lines
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padL, padT);
  ctx.lineTo(padL, H - padB);
  ctx.lineTo(W - padR, H - padB);
  ctx.stroke();

  // y grid (3 lines)
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.setLineDash([4, 6]);
  for (let g = 1; g <= 3; g++) {
    const y = padT + (g / 4) * innerH;
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke();
  }
  ctx.setLineDash([]);

  // area under line
  const grad = ctx.createLinearGradient(0, padT, 0, H - padB);
  grad.addColorStop(0, hexWithAlpha(getCss("--accent", "#ff6a00"), 0.35));
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;

  ctx.beginPath();
  for (let i = 0; i < points.length; i++) {
    const x = xAt(i), y = yAt(values[i]);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.lineTo(W - padR, H - padB);
  ctx.lineTo(padL, H - padB);
  ctx.closePath();
  ctx.fill();

  // stroke line
  ctx.strokeStyle = getCss("--accent-glow", "#ffae42");
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < points.length; i++) {
    const x = xAt(i), y = yAt(values[i]);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // y labels (0 and max)
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = "12px system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(String(minV), padL - 6, H - padB + 4);
  ctx.fillText(String(maxV), padL - 6, padT + 4);

  // x labels (start / end times)
  const start = new Date(times[0] || Date.now());
  const end = new Date(times[times.length - 1] || Date.now());
  ctx.textAlign = "center";
  ctx.fillText(fmtTime(start), padL, H - 8);
  ctx.fillText(fmtTime(end), W - padR, H - 8);

  function fmtTime(d) {
    const h = String(d.getHours()).padStart(2, "0");
    const m = String(d.getMinutes()).padStart(2, "0");
    return `${h}:${m}`;
  }
  function getCss(varName, fallback) {
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || fallback;
  }
  function hexWithAlpha(hex, alpha) {
    // hex like #ff6a00
    const c = hex.replace("#", "");
    if (c.length !== 6) return `rgba(255,106,0,${alpha})`;
    const r = parseInt(c.slice(0,2), 16);
    const g = parseInt(c.slice(2,4), 16);
    const b = parseInt(c.slice(4,6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  function drawError(ctx, W, H, err) {
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = "#120e0b";
    ctx.fillRect(0,0,W,H);
    ctx.fillStyle = "#ffae42";
    ctx.font = "12px system-ui, sans-serif";
    ctx.fillText("Chart error. Try again later.", 12, 20);
    if (err) {
      ctx.fillStyle = "rgba(255,255,255,.6)";
      ctx.fillText(String(err).slice(0, 60), 12, 38);
    }
  }
})();
