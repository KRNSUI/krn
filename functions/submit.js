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
