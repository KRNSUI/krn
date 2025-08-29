// Enhanced Submit API with user identification and validation
// Supports anonymous and identified complaint submissions

import { censorText } from "../src/core/utils/censor.js";

export async function onRequestPost({ request, env }) {
  try {
    if (!env.KRN_DB) throw new Error("KRN_DB binding missing");

    const contentType = request.headers.get("content-type") || "";
    
    // Support both form data and JSON
    let message, authorAddr, isAnonymous;
    
    if (contentType.includes("application/json")) {
      const body = await request.json();
      message = body.message;
      authorAddr = body.author_addr;
      isAnonymous = body.is_anonymous !== false; // Default to anonymous
    } else if (contentType.includes("application/x-www-form-urlencoded") || 
               contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      
      // Honeypot check
      if ((form.get("website") || "").toString().trim() !== "") {
        return Response.redirect(new URL("/thanks.html", request.url), 303);
      }
      
      message = (form.get("message") || "").toString();
      authorAddr = (form.get("author_addr") || "").toString();
      isAnonymous = form.get("is_anonymous") !== "false";
    } else {
      return new Response("Unsupported content type", { status: 415 });
    }

    // Clean and validate message
    message = message.replace(/\r\n/g, "\n").trim();
    
    if (!message) {
      return new Response("Message required", { status: 400 });
    }

    if (message.length > 5000) {
      return new Response("Message too long (max 5000 characters)", { status: 413 });
    }

    // Validate author address if provided
    if (authorAddr && !isAnonymous) {
      authorAddr = authorAddr.trim();
      if (authorAddr.length > 100) {
        return new Response("Author address too long", { status: 400 });
      }
      // Basic Sui address validation (0x followed by 64 hex chars)
      if (!/^0x[a-fA-F0-9]{64}$/.test(authorAddr)) {
        return new Response("Invalid Sui address format", { status: 400 });
      }
    }

    // Sanitize content
    const { text: clean, flagged } = censorText(message);
    
    if (flagged) {
      console.warn("Flagged content submitted:", { original: message.substring(0, 100), flagged });
    }

    // Insert into database
    const now = new Date().toISOString();
    const result = await env.KRN_DB
      .prepare(`
        INSERT INTO complaints (message, created_at, author_addr) 
        VALUES (?, ?, ?)
      `)
      .bind(clean, now, isAnonymous ? null : authorAddr)
      .run();

    const complaintId = result.meta.last_row_id;

    // Log submission for analytics
    console.log("Complaint submitted:", {
      id: complaintId,
      anonymous: isAnonymous,
      author: isAnonymous ? "anonymous" : authorAddr,
      length: clean.length,
      flagged,
      timestamp: now
    });

    // Return success response
    if (contentType.includes("application/json")) {
      return new Response(JSON.stringify({
        ok: true,
        complaint_id: complaintId,
        message: "Complaint submitted successfully",
        anonymous: isAnonymous
      }), {
        status: 200,
        headers: {
          "content-type": "application/json",
          "access-control-allow-origin": "*"
        }
      });
    } else {
      // Redirect for form submissions
      return Response.redirect(new URL("/thanks.html", request.url), 303);
    }

  } catch (err) {
    console.error("submit error:", err);
    return new Response("Server error", { status: 500 });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "content-type"
    }
  });
}
