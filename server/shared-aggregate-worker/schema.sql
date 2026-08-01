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

CREATE TABLE IF NOT EXISTS shared_contribution_staging (
  contributor_id TEXT NOT NULL,
  combination_key TEXT NOT NULL,
  product_key TEXT NOT NULL,
  product_name_normalized TEXT NOT NULL,
  brand_name TEXT,
  product_category TEXT,
  strain_type TEXT,
  region_bucket TEXT,
  body_tags_json TEXT NOT NULL DEFAULT '[]',
  mind_tags_json TEXT NOT NULL DEFAULT '[]',
  mood_tags_json TEXT NOT NULL DEFAULT '[]',
  mood_face TEXT,
  amount_bucket TEXT,
  time_bucket TEXT,
  app_version TEXT,
  submitted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (contributor_id, combination_key)
);
CREATE INDEX IF NOT EXISTS idx_shared_staging_submitted_at
  ON shared_contribution_staging (submitted_at);
CREATE INDEX IF NOT EXISTS idx_shared_staging_contributor_submitted
  ON shared_contribution_staging (contributor_id, submitted_at);

CREATE TABLE IF NOT EXISTS shared_contributor_suppressions (
  contributor_id TEXT PRIMARY KEY,
  suppressed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reason TEXT NOT NULL DEFAULT 'user_opt_out'
);

CREATE TABLE IF NOT EXISTS shared_product_aggregates (
  combination_key TEXT PRIMARY KEY,
  aggregate_scope TEXT NOT NULL CHECK (
    aggregate_scope IN ('combination', 'product', 'product_region')
  ),
  product_key TEXT NOT NULL,
  product_name_normalized TEXT,
  brand_name TEXT,
  product_category TEXT,
  strain_type TEXT,
  region_bucket TEXT,
  body_tags_json TEXT NOT NULL DEFAULT '[]',
  mind_tags_json TEXT NOT NULL DEFAULT '[]',
  mood_tags_json TEXT NOT NULL DEFAULT '[]',
  mood_face TEXT,
  amount_bucket TEXT,
  time_bucket TEXT,
  app_version TEXT,
  total_count INTEGER NOT NULL DEFAULT 0 CHECK (total_count >= 0),
  distinct_contributor_count INTEGER NOT NULL DEFAULT 0 CHECK (distinct_contributor_count >= 0),
  last_updated TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_shared_aggregates_scope_product
  ON shared_product_aggregates (aggregate_scope, product_key);
CREATE INDEX IF NOT EXISTS idx_shared_aggregates_scope_product_region
  ON shared_product_aggregates (aggregate_scope, product_key, region_bucket);

CREATE TABLE IF NOT EXISTS shared_layer2_migration_audit (
  migration_key TEXT PRIMARY KEY,
  opted_out_rows_deleted INTEGER NOT NULL DEFAULT 0,
  old_row_count INTEGER NOT NULL DEFAULT 0,
  aggregate_total INTEGER NOT NULL DEFAULT 0,
  aggregate_row_count INTEGER NOT NULL DEFAULT 0,
  old_table_dropped INTEGER NOT NULL DEFAULT 1,
  completed_at TEXT
);
INSERT INTO shared_layer2_migration_audit (
  migration_key, old_table_dropped, completed_at
) VALUES (
  'layer2_aggregate_redesign_v1', 1, CURRENT_TIMESTAMP
)
ON CONFLICT(migration_key) DO NOTHING;
