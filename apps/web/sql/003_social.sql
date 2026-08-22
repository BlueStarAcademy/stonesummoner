CREATE TABLE IF NOT EXISTS social_profiles (
  actor_id TEXT PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  nick TEXT NOT NULL DEFAULT '',
  level INTEGER NOT NULL DEFAULT 1,
  guild_name TEXT,
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS social_profiles_nick_idx ON social_profiles (nick);
CREATE INDEX IF NOT EXISTS social_profiles_user_id_idx ON social_profiles (user_id);

CREATE TABLE IF NOT EXISTS friend_links (
  user_a TEXT NOT NULL,
  user_b TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_a, user_b),
  CONSTRAINT friend_links_ordered CHECK (user_a < user_b)
);

CREATE INDEX IF NOT EXISTS friend_links_b_idx ON friend_links (user_b);

CREATE TABLE IF NOT EXISTS friend_requests (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (from_id, to_id)
);

CREATE INDEX IF NOT EXISTS friend_requests_to_idx ON friend_requests (to_id);

CREATE TABLE IF NOT EXISTS friend_energy_sent (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  day_key TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id, day_key)
);

CREATE TABLE IF NOT EXISTS friend_energy_inbox (
  id TEXT PRIMARY KEY,
  to_id TEXT NOT NULL,
  from_id TEXT NOT NULL,
  energy INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS friend_energy_inbox_to_idx ON friend_energy_inbox (to_id);
