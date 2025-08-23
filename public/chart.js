(function () {
  const CANVAS_ID = "krnChart";
  const ENDPOINT  = "/bb?hours=24";       // your Worker proxy route
  const REFRESH_MS = 60_000;              // refresh every 60s

  const canvas = document.getElementById(CANVAS_ID);
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  // Theme: oranges
  const COLORS = {
    bgGrid: "rgba(255,165,0,.12)",
    line:   "#ff9933",
    fill1:  "rgba(255,153,51,.25)",
    fill2:  "rgba(255,153,51,0)"
  };

  // DPR-aware resize
  function fitCanvas() {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const { width, height } = canvas.getBoundingClientRect();
    canvas.width  = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function formatHourLabel(d) {
    // show “HH:mm” or “M/D HH”
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }

  // Accepts either:
  // A) { ok:true, labels:[..], series:[..] }
  // B) { ok:true, points:[{t: <ms|iso>, v:<number>}, ...] }
  function normalizeData(json) {
    if (!json) throw new Error("Empty response");
    if (json.ok && Array.isArray(json.labels) && Array.isArray(json.series)) {
      // already in labels/series shape
      return { labels: json.labels, series: json.series.map(v => +v || 0) };
    }
    if (json.ok && Array.isArray(json.points)) {
      const labels = [];
      const series = [];
      for (const p of json.points) {
        const ts = typeof p.t === "number" ? p.t : Date.parse(p.t);
        const d = new Date(ts);
        labels.push(formatHourLabel(d));
        series.push(+p.v || 0);
      }
      return { labels, series };
    }
    // Unknown shape (or error from proxy)
    throw new Error(json.error || "Bad upstream data");
  }

  function drawChart({ labels, series }) {
    // Layout
    const pad = { top: 12, right: 12, bottom: 22, left: 36 };
    const W = canvas.clientWidth;
    const H = canvas.clientHeight;
    if (W <= 0 || H <= 0) return;

    ctx.clearRect(0, 0, W, H);

    const chartW = W - pad.left - pad.right;
    const chartH = H - pad.top - pad.bottom;

    // bounds
    const minY = 0;
    const maxY = Math.max(1, Math.max(...series) * 1.15);

    // helpers
    const xOf = i => pad.left + (series.length <= 1 ? 0 : (i * chartW) / (series.length - 1));
    const yOf = v => pad.top + chartH - (v - minY) / (maxY - minY) * chartH;

    // grid
    ctx.strokeStyle = COLORS.bgGrid;
    ctx.lineWidth = 1;

    // horizontal grid lines (5)
    const steps = 5;
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const y = pad.top + (i * chartH) / steps;
      ctx.moveTo(pad.left, y);
      ctx.lineTo(W - pad.right, y);
    }
    ctx.stroke();

    // y-axis labels
    ctx.fillStyle = "rgba(255,255,255,.7)";
    ctx.font = "12px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (let i = 0; i <= steps; i++) {
      const val = (maxY * (1 - i / steps));
      const y = pad.top + (i * chartH) / steps;
      ctx.fillText(val.toFixed(0), pad.left - 8, y);
    }

    // x-axis labels (~6 ticks)
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    const tickEvery = Math.max(1, Math.floor(labels.length / 6));
    for (let i = 0; i < labels.length; i += tickEvery) {
      const x = xOf(i);
      const label = labels[i];
      ctx.fillText(label, x, H - pad.bottom + 6);
    }

    // line fill gradient
    const grad = ctx.createLinearGradient(0, pad.top, 0, H - pad.bottom);
    grad.addColorStop(0, COLORS.fill1);
    grad.addColorStop(1, COLORS.fill2);

    // area fill
    ctx.beginPath();
    ctx.moveTo(xOf(0), yOf(series[0] || 0));
    for (let i = 1; i < series.length; i++) ctx.lineTo(xOf(i), yOf(series[i]));
    ctx.lineTo(xOf(series.length - 1), H - pad.bottom);
    ctx.lineTo(xOf(0), H - pad.bottom);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // line
    ctx.beginPath();
    ctx.moveTo(xOf(0), yOf(series[0] || 0));
    for (let i = 1; i < series.length; i++) ctx.lineTo(xOf(i), yOf(series[i]));
    ctx.strokeStyle = COLORS.line;
    ctx.lineWidth = 2;
    ctx.shadowColor = "rgba(255,153,51,.35)";
    ctx.shadowBlur = 12;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  function showError(msg) {
    // Draw an error message inside the canvas
    const W = canvas.clientWidth;
    const H = canvas.clientHeight;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "rgba(255,210,170,.9)";
    ctx.font = "14px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif";
    const lines = [`Chart error. Try again later.`, String(msg)];
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    let y = 8;
    for (const line of lines) {
      ctx.fillText(line, 10, y);
      y += 18;
    }
  }

  async function loadAndRender() {
    try {
      fitCanvas();
      const res = await fetch(ENDPOINT, { headers: { "accept": "application/json" } });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(`Upstream ${res.status}: ${JSON.stringify(json)}`);

      const { labels, series } = normalizeData(json);
      if (!labels?.length || !series?.length) throw new Error("Empty dataset");
      drawChart({ labels, series });
    } catch (err) {
      showError(err.message || err);
    }
  }

  // bootstrap
  window.addEventListener("resize", () => loadAndRender());
  loadAndRender();
  setInterval(loadAndRender, REFRESH_MS);
})();
