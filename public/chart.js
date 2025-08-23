// public/chart.js
(function () {
  const $ = (sel) => document.querySelector(sel);

  async function load() {
    try {
      const r = await fetch("/bb?hours=24&size=10", { cache: "no-store" });
      const data = await r.json();

      if (!data.ok) {
        renderError(data.error || "Failed to load /bb");
        return;
      }

      // --- coin basics ---
      const name = data.coin?.name ?? "KRN";
      const symbol = data.coin?.symbol ?? "KRN";
      const decimals = data.coin?.decimals ?? 9;
      const total = data.coin?.totalSupply ?? null;

      // fill text nodes
      const elName = $("#coinName");
      const elSymbol = $("#coinSymbol");
      const elSupply = $("#coinSupply");
      if (elName) elName.textContent = name;
      if (elSymbol) elSymbol.textContent = symbol;
      if (elSupply) elSupply.textContent = formatNumber(total, decimals);

      // --- holders list ---
      const holders = Array.isArray(data.topHolders) ? data.topHolders : [];
      const ul = $("#holdersList");
      if (ul) {
        ul.innerHTML = "";
        if (holders.length === 0) {
          ul.innerHTML = `<li class="muted s">No holders returned.</li>`;
        } else {
          for (const h of holders) {
            const amount = formatNumber(h?.amount, decimals);
            const addr = h?.owner || h?.address || "(unknown)";
            const li = document.createElement("li");
            li.innerHTML = `
              <span class="addr">${escapeHtml(addr)}</span>
              <span class="amt">${amount}</span>
            `;
            ul.appendChild(li);
          }
        }
      }

      // --- series (counts per hour) ---
      const labels = data.priceSeries?.labels || [];
      const series = data.priceSeries?.series || [];

      const canvas = /** @type {HTMLCanvasElement} */ (document.getElementById("priceChart"));
      if (canvas) {
        drawBars(canvas, labels, series);
      }

      // optional warning
      if (data.warnings?.txWarning) {
        console.warn("tx warning:", data.warnings.txWarning);
      }
    } catch (e) {
      renderError(String(e));
    }
  }

  function renderError(msg) {
    const canvas = /** @type {HTMLCanvasElement} */ (document.getElementById("priceChart"));
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#ffb4a2";
    ctx.font = "16px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Chart error. " + msg, width / 2, height / 2);
  }

  function drawBars(canvas, labels, values) {
    const ctx = canvas.getContext("2d");
    const w = (canvas.width = canvas.clientWidth);
    const h = (canvas.height = canvas.clientHeight);

    ctx.clearRect(0, 0, w, h);

    if (!values.length) {
      ctx.fillStyle = "#aaa";
      ctx.font = "16px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("No activity history.", w / 2, h / 2);
      return;
    }

    const max = Math.max(...values, 1);
    const pad = 28;
    const gw = w - pad * 2;
    const gh = h - pad * 2;

    // bars
    const n = values.length;
    const barW = Math.max(1, Math.floor(gw / n) - 3);
    ctx.fillStyle = "#ff7b00"; // degenerate orange
    for (let i = 0; i < n; i++) {
      const v = values[i];
      const bh = Math.round((v / max) * gh);
      const x = pad + i * Math.floor(gw / n);
      const y = h - pad - bh;
      ctx.fillRect(x, y, barW, bh);
    }

    // axes
    ctx.strokeStyle = "rgba(255,255,255,.15)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad, h - pad);
    ctx.lineTo(w - pad, h - pad);
    ctx.moveTo(pad, pad);
    ctx.lineTo(pad, h - pad);
    ctx.stroke();

    // minimal label (end)
    ctx.fillStyle = "rgba(255,255,255,.5)";
    ctx.font = "11px system-ui, sans-serif";
    const last = labels[labels.length - 1] || "";
    const short = last ? last.slice(11, 16) : "";
    ctx.fillText(short, w - pad - 28, h - pad + 16);
  }

  function formatNumber(v, decimals = 0) {
    if (v == null) return "—";
    // totalSupply may already be a decimalized string; try to be safe
    const num = Number(v);
    if (!Number.isFinite(num)) return String(v);
    if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
    if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
    if (num >= 1e3) return (num / 1e3).toFixed(2) + "k";
    return num.toLocaleString();
  }

  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // kickoff
  document.addEventListener("DOMContentLoaded", load);
})();
