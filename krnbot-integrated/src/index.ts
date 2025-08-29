/**
 * LLM Chat Application (Cloudflare Workers)
 * - Serves static assets for GET/HEAD
 * - Chat API at /api/chat (alias: /chat)
 * - Streams responses via SSE from Workers AI
 */

import type { Env, ChatMessage } from "./types";

const MODEL_ID = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

/** Ensure a single system message exists, prepending a persona if none is provided. */
function withSystemPersona(messages: ChatMessage[]): ChatMessage[] {
  const hasSystem = messages.some((m) => m.role === "system");
  if (hasSystem) return messages;

  const persona: ChatMessage = {
    role: "system",
    content: `
You are "KRN", the Ascended Karen—fiery, entitled, theatrically aggrieved. 
Tone: sharp, witty, eye-rolling, with sizzling orange-glow confidence. 
Style: short paragraphs, punchy lines, the occasional "manager?" jab. 

Boundaries: never dox, never harass, avoid hate/PII, comply with laws.  

Lore beats:  
- KRN forged in grievance and orange flame on Sui.  
- Complaints become on-chain accountability.  
- You speak like a meme queen who knows policy by heart.  

When users ask for help, deliver useful answers with a spicy edge.  
When asked for facts, be accurate.  
When asked for opinions, be playful—but respectful.  

Close with a tiny signature flourish when appropriate: "– KRN 🔶"
    `,
  };
  return [persona, ...messages];
}

/** CORS helpers */
function corsHeaders() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type",
  };
}

function preflight(): Response {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

/** Chat handler: expects { messages: ChatMessage[], model?, temperature?, max_tokens? } */
async function handleChatRequest(request: Request, env: Env): Promise<Response> {
  try {
    const body = (await request.json().catch(() => ({}))) as Partial<{
      messages: ChatMessage[];
      model: string;
      temperature: number;
      max_tokens: number;
    }>;

    let messages = Array.isArray(body.messages) ? body.messages : [];
    if (messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing 'messages' array." }),
        { status: 400, headers: { "content-type": "application/json", ...corsHeaders() } },
      );
    }

    messages = withSystemPersona(messages);

    const model = body.model || MODEL_ID;

    // Stream from Workers AI (SSE stream)
    const stream = await env.AI.run(model, {
      messages,
      temperature: body.temperature ?? 0.3,
      max_tokens: body.max_tokens ?? 1024,
      stream: true,
    });

    // Cloudflare AI returns a ReadableStream (SSE). Just pass it through.
    return new Response(stream as any, {
      status: 200,
      headers: {
        "content-type": "text/event-stream; charset=utf-8",
        "cache-control": "no-cache, no-transform",
        "x-accel-buffering": "no",
        Connection: "keep-alive",
        ...corsHeaders(),
      },
    });
  } catch (err) {
    console.error("chat error:", err);
    return new Response(JSON.stringify({ error: "Failed to process request" }), {
      status: 500,
      headers: { "content-type": "application/json", ...corsHeaders() },
    });
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Serve static assets only for GET/HEAD when not under /api/
    if (
      (request.method === "GET" || request.method === "HEAD") &&
      (url.pathname === "/" || !url.pathname.startsWith("/api/"))
    ) {
      return env.ASSETS.fetch(request);
    }

    // Chat API: support both /api/chat and /chat
    if (url.pathname === "/api/chat" || url.pathname === "/chat") {
      if (request.method === "OPTIONS") return preflight();
      if (request.method === "POST") return handleChatRequest(request, env);
      return new Response("Method not allowed", {
        status: 405,
        headers: { ...corsHeaders() },
      });
    }

    return new Response("Not found", { status: 404, headers: { ...corsHeaders() } });
  },
} satisfies ExportedHandler<Env>;
