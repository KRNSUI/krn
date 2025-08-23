export async function onRequestPost({ request, env }) {
  try {
    const ct = request.headers.get("content-type") || "";
    if (!/application\/x-www-form-urlencoded|multipart\/form-data/.test(ct))
      return new Response("Unsupported content type", { status: 415 });

    const form = await request.formData();
    if ((form.get("website") || "").toString().trim() !== "")
      return Response.redirect(new URL("/thanks.html", request.url), 303);

    const msg = (form.get("message") || "").toString().trim();
    if (!msg) return new Response("Message required", { status: 400 });
    if (msg.length > 5000) return new Response("Message too long", { status: 413 });

    if (!env.KRN_DB) throw new Error("KRN_DB binding missing");

    await env.KRN_DB
      .prepare("INSERT INTO complaints (message, created_at) VALUES (?1, datetime('now'))")
      .bind(msg)
      .run();

    return Response.redirect(new URL("/thanks.html", request.url), 303);
  } catch (err) {
    console.error("submit error:", err);
    return new Response("Server error", { status: 500 });
  }
}
// functions/submit.js
import { censorText } from "../public/censor.js"; // Pages Functions can import local modules

export const onRequest = async ({ request, env }) => {
  try {
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("application/x-www-form-urlencoded") &&
        !contentType.includes("multipart/form-data")) {
      return new Response("Bad Request", { status: 400 });
    }

    const form = await request.formData();
    const honeypot = (form.get("website") || "").toString().trim();
    if (honeypot) {
      // Bot
      return Response.redirect("/thanks.html", 303);
    }

    let message = (form.get("message") || "").toString();
    message = message.replace(/\r\n/g, "\n").trim();

    if (!message) {
      return new Response("Message required", { status: 400 });
    }

    // Hard max (DB + UI)
    if (message.length > 5000) {
      return new Response("Message too long", { status: 413 });
    }

    // 🔒 Sanitize on server
    const { text: clean, flagged } = censorText(message);

    // Insert (stores sanitized clean text)
    if (!env.KRN_DB) throw new Error("KRN_DB binding missing");
    const now = new Date().toISOString();
    await env.KRN_DB
      .prepare("INSERT INTO complaints (message, created_at) VALUES (?, ?)")
      .bind(clean, now)
      .run();

    // Redirect to page (or send JSON if you want fetch)
    return Response.redirect("/thanks.html", 303);
  } catch (err) {
    console.error("submit error:", err);
    return new Response("Server error", { status: 500 });
  }
};
