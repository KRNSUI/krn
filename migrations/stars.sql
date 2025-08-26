-- stars table
CREATE TABLE IF NOT EXISTS stars (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  complaint_id TEXT NOT NULL,
  addr TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE (complaint_id, addr)
);

-- helpful view for counts
CREATE VIEW IF NOT EXISTS stars_count AS
SELECT complaint_id, COUNT(*) AS cnt
FROM stars
GROUP BY complaint_id;
