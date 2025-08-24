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
      const coin = data.coin || {};
      const name = coin.name ?? coin.metadata?.name ?? "KRN";
      const symbol = coin.symbol ?? coin.metadata?.symbol ?? "KRN";
      const decimals = toInt(coin.decimals, 9);

      // Total Supply:
      // 1) if coin.totalSupply is already human-readable, show it
      // 2) else, if coin.totalSupplyRaw exists, scale by `decimals`
      // 3) else, show em dash
      let supplyText = "—";
      if (isPresent(coin.totalSupply)) {
        supplyText = String(coin.totalSupply);
      } else if (isPresent(coin.totalSupplyRaw)) {
        const human = toHumanBigInt(String(coin.totalSupplyRaw), decimals, 4);
        supplyText = human;
      }

      // fill text nodes
      const elName = $("#coinName");
      const elSymbol = $("#coinSymbol");
      const elSupply = $("#coinSupply");
      if (elName) elName.textContent = name;
      if (elSymbol) elSymbol.textContent = symbol;
      if (elSupply) elSupply.textContent = supplyText;

      // --- holders list ---
      const holders = Array.isArray(data.topHolders) ? data.topHolders : [];
      const ul = $("#holdersList");
      if (ul) {
        ul.innerHTML = "";
        if (holders.length === 0) {
          ul.innerHTML = `<li class="muted s">No holders returned.</li>`;
        } else {
          for (const h of holders) {
            const rawAmt = h?.amount ?? h?.balance ?? h?.value;
            // amount may be bigint string → scale by decimals, else show as-is
            const amtHuman = isPresent(rawAmt)
              ? toHumanMaybe(rawAmt, decimals)
              : "—";
            const addr = h?.owner || h?.address || "(unknown)";
            const li = document.createElement("li");
            li.innerHTML = `
              <span class="addr">${escapeHtml(addr)}</span>
              <span class="amt">${escapeHtml(amtHuman)}</span>
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
        // keep silent or log; leaving as console.warn
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
    const cellW = Math.floor(gw / n);
    const barW = Math.max(1, cellW - 3);
    ctx.fillStyle = "#ff7b00"; // degenerate orange
    for (let i = 0; i < n; i++) {
      const v = values[i];
      const bh = Math.round((v / max) * gh);
      const x = pad + i * cellW;
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

  // --- helpers ---
  function isPresent(v) {
    return v !== undefined && v !== null && v !== "";
  }

  function toInt(v, def = 0) {
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : def;
  }

  // Convert big-int string + decimals → human string (e.g., "123.4567")
  function toHumanBigInt(raw, decimals, maxFrac = 4) {
    const neg = String(raw).startsWith("-");
    let s = neg ? String(raw).slice(1) : String(raw);
    s = s.replace(/\D/g, "") || "0"; // keep digits only
    // pad so we can slice decimals reliably
    const pad = s.padStart(decimals + 1, "0");
    let int = pad.slice(0, pad.length - decimals);
    let frac = pad.slice(pad.length - decimals);
    // trim and limit fractional precision
    frac = frac.replace(/0+$/g, "").slice(0, maxFrac);
    int = int.replace(/^0+(?=\d)/, "");
    const out = (neg ? "-" : "") + (int || "0") + (frac ? "." + frac : "");
    return out;
  }

  // If it's a number or formatted string, show it;
  // if it's a bigint string, convert using decimals
  function toHumanMaybe(val, decimals) {
    if (!isPresent(val)) return "—";
    const asNum = Number(val);
    if (Number.isFinite(asNum)) {
      return formatNumber(asNum);
    }
    // probably a big-int string
    const human = toHumanBigInt(String(val), decimals, 4);
    return formatNumber(Number(human)) || human;
  }

  function formatNumber(n) {
    if (!Number.isFinite(n)) return String(n);
    if (n >= 1e12) return (n / 1e12).toFixed(2) + "T";
    if (n >= 1e9)  return (n / 1e9 ).toFixed(2) + "B";
    if (n >= 1e6)  return (n / 1e6 ).toFixed(2) + "M";
    if (n >= 1e3)  return (n / 1e3 ).toFixed(2) + "k";
    if (n < 1 && n > 0) return n.toPrecision(3);
    return n.toLocaleString();
  }

  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  document.addEventListener("DOMContentLoaded", load);
})();
