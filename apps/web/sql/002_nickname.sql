ALTER TABLE users ADD COLUMN IF NOT EXISTS nickname TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS users_nickname_unique_idx
  ON users (nickname)
  WHERE nickname IS NOT NULL;
