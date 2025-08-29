// krnbot.js
// Minimal chat UI with streaming SSE + endpoint probing.

(() => {
  const $ = (q) => document.querySelector(q);

  // DOM nodes expected by krnbot.html
  const log = $("#log");
  const statusEl = $("#status");
  const errorEl = $("#error");
  const clearBtn = $("#clearBtn");
  const input = $("#input");
  const sendBtn = $("#sendBtn");
  const stopBtn = $("#stopBtn");

  // Prefer the API route first (fix)
  const CANDIDATE_ENDPOINTS = ["/api/chat", "/chat", "/v1/chat"];

  let ENDPOINT = null;
  let controller = null;
  const history = [];

  function setStatus(text) {
    if (statusEl) statusEl.textContent = text || "";
  }
  function setError(text) {
    if (errorEl) {
      errorEl.textContent = text || "";
      errorEl.style.display = text ? "block" : "none";
    }
  }

  function el(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === "class") node.className = v;
      else if (k === "dataset") Object.assign(node.dataset, v);
      else node.setAttribute(k, v);
    });
    for (const c of children) {
      if (c == null) continue;
      node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    }
    return node;
  }

  function appendBubble(role, text = "") {
    const bubble = el(
      "div",
      { class: `bubble ${role}` },
      el("div", { class: "role" }, role === "assistant" ? "KRN" : "You"),
      el("div", { class: "content" }, text),
    );
    log.appendChild(bubble);
    log.scrollTop = log.scrollHeight;
    return bubble.querySelector(".content");
  }

  async function probeEndpoint() {
    if (ENDPOINT) return ENDPOINT;
    for (const path of CANDIDATE_ENDPOINTS) {
      try {
        // GET should return 405 for API routes; accept 200/204/405 as a "found" signal
        const res = await fetch(path, { method: "GET" });
        if ([200, 204, 405].includes(res.status)) {
          ENDPOINT = path;
          return ENDPOINT;
        }
      } catch (_) {}
    }
    throw new Error("No chat endpoint found.");
  }

  function welcome() {
    appendBubble(
      "assistant",
      "Welcome to KRN support. State your grievance clearly; the blockchain is listening. – KRN 🔶",
    );
  }

  async function sendMessage() {
    setError("");
    const text = input.value.trim();
    if (!text) return;

    // Push user message
    history.push({ role: "user", content: text });
    appendBubble("user", text);
    input.value = "";

    const assistantContentEl = appendBubble("assistant", "");
    stopBtn.disabled = false;
    sendBtn.disabled = true;
    setStatus("Thinking…");

    controller = new AbortController();
    let endpoint;
    try {
      endpoint = await probeEndpoint();
    } catch (err) {
      setError(err.message || "Failed to discover API.");
      stopBtn.disabled = true;
      sendBtn.disabled = false;
      setStatus("");
      return;
    }

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: withSystemPersona(history) }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const msg = await safeText(res);
        throw new Error(`Request failed (${res.status}). ${msg || ""}`);
      }

      // Read SSE stream
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let full = "";

      while (!done) {
        const chunk = await reader.read();
        done = chunk.done;
        if (chunk.value) {
          const text = decoder.decode(chunk.value, { stream: true });
          for (const line of text.split(/\r?\n/)) {
            const m = /^data:\s*(.*)$/.exec(line);
            if (!m) continue;
            const data = m[1];
            if (data === "[DONE]" || data === "") continue;
            try {
              const obj = JSON.parse(data);
              const piece =
                typeof obj === "string"
                  ? obj
                  : obj.delta ?? obj.response ?? obj.text ?? "";
              if (piece) {
                full += piece;
                assistantContentEl.textContent = full;
                log.scrollTop = log.scrollHeight;
              }
            } catch {
              // Sometimes the stream sends plain text fragments
              if (data && data !== "[DONE]") {
                full += data;
                assistantContentEl.textContent = full;
              }
            }
          }
        }
      }

      history.push({ role: "assistant", content: full || "" });
    } catch (err) {
      if (err.name !== "AbortError") {
        setError(err.message || "Streaming failed.");
      }
    } finally {
      stopBtn.disabled = true;
      sendBtn.disabled = false;
      controller = null;
      setStatus("");
    }
  }

  function withSystemPersona(msgs) {
    const hasSystem = msgs.some((m) => m.role === "system");
    if (hasSystem) return msgs;
    return [
      {
        role: "system",
        content:
          "You are KRN (Karen). Be helpful, fast, and sharp-witted. " +
          "Speak concise English; stay safe; no harassment.",
      },
      ...msgs,
    ];
  }

  function stopStreaming() {
    if (controller) controller.abort();
  }

  function clearChat() {
    history.length = 0;
    log.innerHTML = "";
    setStatus("");
    setError("");
    welcome();
  }

  async function safeText(res) {
    try {
      const t = await res.text();
      return t.slice(0, 400);
    } catch {
      return "";
    }
  }

  // Wire up events
  if (sendBtn) sendBtn.addEventListener("click", sendMessage);
  if (stopBtn) stopBtn.addEventListener("click", stopStreaming);
  if (clearBtn) clearBtn.addEventListener("click", clearChat);

  if (input) {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }

  // Boot
  welcome();
})();
