// Enhanced Complaints API with full CRUD operations
// Supports pagination, stars, flags, and user interactions

export async function onRequestGet({ request, env }) {
  try {
    if (!env.KRN_DB) throw new Error("KRN_DB binding missing");

    const url = new URL(request.url);
    const userAddr = url.searchParams.get("user_addr");

    // --- Single complaint reveal ---
    const id = url.searchParams.get("id");
    const reveal = url.searchParams.get("reveal");
    if (id && reveal) {
      const row = await env.KRN_DB
        .prepare(`
          SELECT c.id, c.message, c.created_at, c.author_addr, c.star_count, c.flag_count, c.is_flagged,
                 CASE WHEN s.user_addr IS NOT NULL THEN 1 ELSE 0 END as user_starred,
                 CASE WHEN f.user_addr IS NOT NULL THEN 1 ELSE 0 END as user_flagged
          FROM complaints c
          LEFT JOIN stars s ON c.id = s.complaint_id AND s.user_addr = ?
          LEFT JOIN flags f ON c.id = f.complaint_id AND f.user_addr = ?
          WHERE c.id = ?
        `)
        .bind(userAddr || null, userAddr || null, id)
        .first();

      return json({
        ok: true,
        complaint: row || null,
      });
    }

    // --- List complaints with pagination ---
    const limit = clampInt(url.searchParams.get("limit"), 50, 1, 200);
    const before = url.searchParams.get("before"); // ISO string or millis
    const after = url.searchParams.get("after"); // ISO string or millis
    const sort = url.searchParams.get("sort") || "newest"; // newest, oldest, most_starred, most_flagged
    const showFlagged = url.searchParams.get("show_flagged") === "true";

    let sql = `
      SELECT c.id, c.message, c.created_at, c.author_addr, c.star_count, c.flag_count, c.is_flagged,
             CASE WHEN s.user_addr IS NOT NULL THEN 1 ELSE 0 END as user_starred,
             CASE WHEN f.user_addr IS NOT NULL THEN 1 ELSE 0 END as user_flagged
      FROM complaints c
      LEFT JOIN stars s ON c.id = s.complaint_id AND s.user_addr = ?
      LEFT JOIN flags f ON c.id = f.complaint_id AND f.user_addr = ?
    `;
    
    const bind = [userAddr || null, userAddr || null];
    const whereConditions = [];

    // Filter out flagged content unless explicitly requested
    if (!showFlagged) {
      whereConditions.push("c.is_flagged = 0");
    }

    // Pagination
    if (before) {
      let beforeVal = before;
      if (/^\d+$/.test(before)) {
        beforeVal = new Date(Number(before)).toISOString();
      }
      whereConditions.push("datetime(c.created_at) < datetime(?)");
      bind.push(beforeVal);
    }

    if (after) {
      let afterVal = after;
      if (/^\d+$/.test(after)) {
        afterVal = new Date(Number(after)).toISOString();
      }
      whereConditions.push("datetime(c.created_at) > datetime(?)");
      bind.push(afterVal);
    }

    if (whereConditions.length > 0) {
      sql += " WHERE " + whereConditions.join(" AND ");
    }

    // Sorting
    switch (sort) {
      case "oldest":
        sql += " ORDER BY datetime(c.created_at) ASC";
        break;
      case "most_starred":
        sql += " ORDER BY c.star_count DESC, datetime(c.created_at) DESC";
        break;
      case "most_flagged":
        sql += " ORDER BY c.flag_count DESC, datetime(c.created_at) DESC";
        break;
      case "newest":
      default:
        sql += " ORDER BY datetime(c.created_at) DESC";
        break;
    }

    sql += " LIMIT ?";
    bind.push(limit);

    const result = await env.KRN_DB.prepare(sql).bind(...bind).all();

    // Calculate pagination metadata
    const hasMore = result.results.length === limit;
    const firstItem = result.results[0];
    const lastItem = result.results[result.results.length - 1];

    return json({
      ok: true,
      complaints: result.results || [],
      pagination: {
        has_more: hasMore,
        before_cursor: lastItem?.created_at,
        after_cursor: firstItem?.created_at,
        total_returned: result.results.length,
        limit
      }
    });

  } catch (e) {
    console.error("complaints error:", e);
    return new Response("Server error", { status: 500 });
  }
}

export async function onRequestPost({ request, env }) {
  try {
    if (!env.KRN_DB) throw new Error("KRN_DB binding missing");

    const { action, complaintId, userAddr, reason, message } = await request.json();
    
    if (!action || !complaintId || !userAddr) {
      return new Response("Missing required fields", { status: 400 });
    }

    // Validate complaint exists
    const complaint = await env.KRN_DB
      .prepare("SELECT id FROM complaints WHERE id = ?")
      .bind(complaintId)
      .first();

    if (!complaint) {
      return new Response("Complaint not found", { status: 404 });
    }

    let result;
    let operation;

    switch (action) {
      case "star":
        result = await env.KRN_DB
          .prepare("INSERT OR IGNORE INTO stars (complaint_id, user_addr) VALUES (?, ?)")
          .bind(complaintId, userAddr)
          .run();
        operation = "starred";
        break;

      case "unstar":
        result = await env.KRN_DB
          .prepare("DELETE FROM stars WHERE complaint_id = ? AND user_addr = ?")
          .bind(complaintId, userAddr)
          .run();
        operation = "unstarred";
        break;

      case "flag":
        result = await env.KRN_DB
          .prepare("INSERT OR IGNORE INTO flags (complaint_id, user_addr, reason) VALUES (?, ?, ?)")
          .bind(complaintId, userAddr, reason || null)
          .run();
        operation = "flagged";
        break;

      case "unflag":
        result = await env.KRN_DB
          .prepare("DELETE FROM flags WHERE complaint_id = ? AND user_addr = ?")
          .bind(complaintId, userAddr)
          .run();
        operation = "unflagged";
        break;

      default:
        return new Response("Unknown action", { status: 400 });
    }

    // Get updated counts
    const [starCount, flagCount] = await Promise.all([
      env.KRN_DB
        .prepare("SELECT COUNT(*) as count FROM stars WHERE complaint_id = ?")
        .bind(complaintId)
        .first(),
      env.KRN_DB
        .prepare("SELECT COUNT(*) as count FROM flags WHERE complaint_id = ?")
        .bind(complaintId)
        .first()
    ]);

    // Check if user has starred/flagged this complaint
    const [userStarred, userFlagged] = await Promise.all([
      env.KRN_DB
        .prepare("SELECT 1 FROM stars WHERE complaint_id = ? AND user_addr = ?")
        .bind(complaintId, userAddr)
        .first(),
      env.KRN_DB
        .prepare("SELECT 1 FROM flags WHERE complaint_id = ? AND user_addr = ?")
        .bind(complaintId, userAddr)
        .first()
    ]);

    return json({
      ok: true,
      operation,
      complaint_id: complaintId,
      star_count: Number(starCount?.count || 0),
      flag_count: Number(flagCount?.count || 0),
      user_starred: !!userStarred,
      user_flagged: !!userFlagged,
      message: `Successfully ${operation} complaint`
    });

  } catch (e) {
    console.error("complaints POST error:", e);
    return new Response("Server error", { status: 500 });
  }
}

// Helper functions
function clampInt(v, def, min, max) {
  const n = parseInt(v ?? def, 10);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : def;
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { 
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, POST, OPTIONS",
      "access-control-allow-headers": "content-type"
    },
  });
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, POST, OPTIONS",
      "access-control-allow-headers": "content-type"
    }
  });
}
