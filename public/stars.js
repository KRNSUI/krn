// public/stars.js
export async function fetchStars(complaintId) {
  const r = await fetch(`/stars?complaint=${encodeURIComponent(complaintId)}`, { cache: "no-store" });
  if (!r.ok) return { count: 0, you: false };
  return r.json();
}

export async function postStarToggle({ complaintId, action, payload }) {
  const r = await fetch(`/stars/toggle`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ complaintId, action, payload }),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}
