-- Stars per complaint
CREATE TABLE IF NOT EXISTS stars (
  post_id TEXT NOT NULL,
  addr    TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (post_id, addr)
);
