CREATE TABLE IF NOT EXISTS shared_contributors (
  anonymous_contributor_id TEXT PRIMARY KEY,
  is_active INTEGER NOT NULL DEFAULT 0,
  opted_in_at TEXT,
  opted_out_at TEXT,
  delete_requested_at TEXT,
  delete_completed_at TEXT,
  jurisdiction_or_region_optional TEXT,
  app_version TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shared_product_contributions (
  contribution_id TEXT PRIMARY KEY,
  anonymous_contributor_id TEXT NOT NULL,
  product_key TEXT NOT NULL,
  product_name_normalized TEXT NOT NULL,
  brand_name TEXT,
  category TEXT,
  strain_type TEXT,
  dispensary_place_id TEXT,
  dispensary_name_normalized TEXT,
  region_bucket TEXT,
  body_tags_json TEXT NOT NULL DEFAULT '[]',
  mind_tags_json TEXT NOT NULL DEFAULT '[]',
  mood_tags_json TEXT NOT NULL DEFAULT '[]',
  mood_face TEXT,
  amount_bucket TEXT,
  entry_logged_at_bucket TEXT,
  source_app_version TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (anonymous_contributor_id) REFERENCES shared_contributors(anonymous_contributor_id)
);

CREATE INDEX IF NOT EXISTS idx_shared_contributions_contributor
  ON shared_product_contributions (anonymous_contributor_id);

CREATE INDEX IF NOT EXISTS idx_shared_contributions_product
  ON shared_product_contributions (product_key);

CREATE INDEX IF NOT EXISTS idx_shared_contributions_product_region
  ON shared_product_contributions (product_key, region_bucket);

CREATE TABLE IF NOT EXISTS shared_product_aggregates (
  aggregate_id TEXT PRIMARY KEY,
  product_key TEXT NOT NULL,
  product_name_normalized TEXT,
  region_bucket TEXT,
  sample_size INTEGER NOT NULL DEFAULT 0,
  effect_counts_json TEXT NOT NULL DEFAULT '{}',
  effect_percentages_json TEXT NOT NULL DEFAULT '{}',
  mood_face_counts_json TEXT NOT NULL DEFAULT '{}',
  category_counts_json TEXT NOT NULL DEFAULT '{}',
  minimum_pool_met INTEGER NOT NULL DEFAULT 0,
  last_calculated_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_shared_aggregates_product_region
  ON shared_product_aggregates (product_key, COALESCE(region_bucket, ''));
