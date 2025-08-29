-- Enhanced KRN Database Schema
-- Supports complaints, stars, flags, and user interactions

-- Main complaints table
CREATE TABLE IF NOT EXISTS complaints (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  author_addr TEXT, -- Optional: if user wants to be identified
  is_flagged BOOLEAN DEFAULT 0,
  flag_count INTEGER DEFAULT 0,
  star_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0
);

-- Stars table for user interactions
CREATE TABLE IF NOT EXISTS stars (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  complaint_id INTEGER NOT NULL,
  user_addr TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
  UNIQUE(complaint_id, user_addr)
);

-- Flags table for content moderation
CREATE TABLE IF NOT EXISTS flags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  complaint_id INTEGER NOT NULL,
  user_addr TEXT NOT NULL,
  reason TEXT, -- Optional reason for flagging
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
  UNIQUE(complaint_id, user_addr)
);

-- User sessions/activity tracking
CREATE TABLE IF NOT EXISTS user_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_addr TEXT NOT NULL,
  session_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_activity TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_addr, session_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON complaints(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_complaints_author ON complaints(author_addr);
CREATE INDEX IF NOT EXISTS idx_complaints_star_count ON complaints(star_count DESC);
CREATE INDEX IF NOT EXISTS idx_complaints_flag_count ON complaints(flag_count DESC);
CREATE INDEX IF NOT EXISTS idx_stars_complaint_id ON stars(complaint_id);
CREATE INDEX IF NOT EXISTS idx_stars_user_addr ON stars(user_addr);
CREATE INDEX IF NOT EXISTS idx_flags_complaint_id ON flags(complaint_id);
CREATE INDEX IF NOT EXISTS idx_flags_user_addr ON flags(user_addr);
CREATE INDEX IF NOT EXISTS idx_user_sessions_addr ON user_sessions(user_addr);
CREATE INDEX IF NOT EXISTS idx_user_sessions_activity ON user_sessions(last_activity);

-- Triggers to maintain counts
CREATE TRIGGER IF NOT EXISTS update_star_count_insert
AFTER INSERT ON stars
BEGIN
  UPDATE complaints 
  SET star_count = (
    SELECT COUNT(*) FROM stars WHERE complaint_id = NEW.complaint_id
  ),
  updated_at = datetime('now')
  WHERE id = NEW.complaint_id;
END;

CREATE TRIGGER IF NOT EXISTS update_star_count_delete
AFTER DELETE ON stars
BEGIN
  UPDATE complaints 
  SET star_count = (
    SELECT COUNT(*) FROM stars WHERE complaint_id = OLD.complaint_id
  ),
  updated_at = datetime('now')
  WHERE id = OLD.complaint_id;
END;

CREATE TRIGGER IF NOT EXISTS update_flag_count_insert
AFTER INSERT ON flags
BEGIN
  UPDATE complaints 
  SET flag_count = (
    SELECT COUNT(*) FROM flags WHERE complaint_id = NEW.complaint_id
  ),
  is_flagged = CASE 
    WHEN (SELECT COUNT(*) FROM flags WHERE complaint_id = NEW.complaint_id) >= 3 THEN 1 
    ELSE 0 
  END,
  updated_at = datetime('now')
  WHERE id = NEW.complaint_id;
END;

CREATE TRIGGER IF NOT EXISTS update_flag_count_delete
AFTER DELETE ON flags
BEGIN
  UPDATE complaints 
  SET flag_count = (
    SELECT COUNT(*) FROM flags WHERE complaint_id = OLD.complaint_id
  ),
  is_flagged = CASE 
    WHEN (SELECT COUNT(*) FROM flags WHERE complaint_id = OLD.complaint_id) >= 3 THEN 1 
    ELSE 0 
  END,
  updated_at = datetime('now')
  WHERE id = OLD.complaint_id;
END;
