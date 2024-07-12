-- Migration number: 0002 	 2024-07-12T11:41:30.139Z
-- Rename old table
ALTER TABLE badge
  RENAME TO old_badge;
-- Create new table
CREATE TABLE badge (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId TEXT NOT NULL,
  badge TEXT NOT NULL,
  tooltip TEXT NOT NULL,
  badgeType TEXT DEFAULT 'donor' NOT NULL
);
-- Insert old data into new table
INSERT INTO badge (userId, badge, tooltip, badgeType)
SELECT userId,
  badge,
  tooltip,
  badgeType
FROM old_badge;
-- Drop old table
DROP TABLE old_badge;