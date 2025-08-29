// /api/stars/toggle.js
export async function onRequestPost({ request, env }) {
  try {
    if (!env.KRN_DB) {
      return json({ ok: false, error: "KRN_DB binding missing" }, 500);
    }

    // Body: { id: string, dir: "up" | "down", addr: string, demo?: boolean }
    const { id, dir, addr, demo } = await request.json().catch(() => ({}));
    if (!id || !["up", "down"].includes(dir) || !addr) {
      return json({ ok: false, error: "bad input: need id, dir (up/down), and addr" }, 400);
    }

    // Ensure the stars table exists (no-op after first time)
    await env.KRN_DB.prepare(`
      CREATE TABLE IF NOT EXISTS stars (
        post_id TEXT NOT NULL,
        addr    TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (post_id, addr)
      )
    `).run();

    let operation;
    let newCount;
    let cost = 0;
    let reason = "";

    if (dir === "up") {
      // Adding a star (favoriting)
      try {
        // Check if user already starred this post
        const existing = await env.KRN_DB
          .prepare("SELECT 1 FROM stars WHERE post_id = ? AND addr = ?")
          .bind(id, addr)
          .first();

        if (existing) {
          return json({ ok: false, error: "Already starred this post" }, 400);
        }

        // Count total stars on this post to determine cost
        const totalStars = await env.KRN_DB
          .prepare("SELECT COUNT(*) as count FROM stars WHERE post_id = ?")
          .bind(id)
          .first();
        
        const currentStarCount = totalStars?.count || 0;
        
        // Calculate cost: first star = 1 KRN, additional = 2 KRN, 3 KRN, etc.
        if (currentStarCount === 0) {
          cost = 1; // First star costs 1 KRN
          reason = "First star on post";
        } else {
          cost = currentStarCount + 1; // 2nd star = 2 KRN, 3rd = 3 KRN, etc.
          reason = `${currentStarCount + 1}th star on post`;
        }

        // Add the star
        await env.KRN_DB
          .prepare("INSERT INTO stars (post_id, addr) VALUES (?, ?)")
          .bind(id, addr)
          .run();

        operation = "added";
      } catch (err) {
        if (err.message.includes("UNIQUE constraint failed")) {
          return json({ ok: false, error: "Already starred this post" }, 400);
        }
        throw err;
      }
    } else {
      // Removing a star (unfavoriting)
      
      // First check if this is the user's own star
      const ownStar = await env.KRN_DB
        .prepare("SELECT 1 FROM stars WHERE post_id = ? AND addr = ?")
        .bind(id, addr)
        .first();

      if (ownStar) {
        // Removing own star - count how many stars this user has on this post
        const userStarCount = await env.KRN_DB
          .prepare("SELECT COUNT(*) as count FROM stars WHERE post_id = ? AND addr = ?")
          .bind(id, addr)
          .first();
        
        const userStarsOnPost = userStarCount?.count || 0;
        
        // Calculate cost: 2 KRN, 4 KRN, 6 KRN (doubles each time)
        cost = userStarsOnPost * 2;
        reason = `Removing ${userStarsOnPost}th own star`;
        
        // Remove the star
        const result = await env.KRN_DB
          .prepare("DELETE FROM stars WHERE post_id = ? AND addr = ?")
          .bind(id, addr)
          .run();

        if (result.changes === 0) {
          return json({ ok: false, error: "No star found to remove" }, 400);
        }
      } else {
        // Removing someone else's star - this costs double and multiplies
        const totalStars = await env.KRN_DB
          .prepare("SELECT COUNT(*) as count FROM stars WHERE post_id = ?")
          .bind(id)
          .first();
        
        const currentStarCount = totalStars?.count || 0;
        
        // Double the charge for removing others' stars
        cost = currentStarCount * 2;
        reason = `Removing someone else's star (${currentStarCount} total stars on post)`;
        
        // Remove a random star from this post (not the user's own)
        const result = await env.KRN_DB
          .prepare("DELETE FROM stars WHERE post_id = ? AND addr != ? LIMIT 1")
          .bind(id, addr)
          .run();

        if (result.changes === 0) {
          return json({ ok: false, error: "No other stars found to remove" }, 400);
        }
      }

      operation = "removed";
    }

    // Get updated count for this post
    const countResult = await env.KRN_DB
      .prepare("SELECT COUNT(*) as count FROM stars WHERE post_id = ?")
      .bind(id)
      .first();

    newCount = countResult?.count ?? 0;

    return json({ 
      ok: true, 
      count: newCount, 
      operation,
      cost,
      reason,
      message: dir === "up" ? `Star added successfully (${cost} KRN)` : `Star removed successfully (${cost} KRN)`
    });

  } catch (err) {
    console.error("star toggle error:", err);
    return json({ ok: false, error: "server error" }, 500);
  }
}

/* ---------- helpers ---------- */
function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
