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
  PRIMARY KEY (contributor_id, combination_key, submitted_at)
);
CREATE INDEX IF NOT EXISTS idx_shared_staging_submitted_at
  ON shared_contribution_staging (submitted_at);
CREATE INDEX IF NOT EXISTS idx_shared_staging_contributor_submitted
  ON shared_contribution_staging (contributor_id, submitted_at);
CREATE INDEX IF NOT EXISTS idx_shared_staging_product_region_combination
  ON shared_contribution_staging (product_key, region_bucket, combination_key);

CREATE TABLE IF NOT EXISTS shared_contributor_suppressions (
  contributor_id TEXT PRIMARY KEY,
  suppressed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reason TEXT NOT NULL DEFAULT 'user_opt_out'
);

-- Short-lived source-level events used only to slow rapid creation of many
-- contributor IDs from one network. No contributor ID or pool key is stored.
CREATE TABLE IF NOT EXISTS shared_contributor_creation_events (
  event_id TEXT PRIMARY KEY,
  source_key TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_shared_creation_events_source_created
  ON shared_contributor_creation_events (source_key, created_at);
CREATE INDEX IF NOT EXISTS idx_shared_creation_events_expires
  ON shared_contributor_creation_events (expires_at);

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

-- A pool first enters this table when it meets its threshold. The row stores
-- only pool metadata and the beginning of the confirmation period.
CREATE TABLE IF NOT EXISTS shared_pool_eligibility_pending (
  eligibility_scope TEXT NOT NULL CHECK (
    eligibility_scope IN (
      'product',
      'product_region',
      'combination_product',
      'combination_region'
    )
  ),
  product_key TEXT NOT NULL,
  region_bucket TEXT NOT NULL DEFAULT '',
  combination_key TEXT NOT NULL DEFAULT '',
  pending_since TEXT NOT NULL,
  PRIMARY KEY (
    eligibility_scope,
    product_key,
    region_bucket,
    combination_key
  )
);
CREATE INDEX IF NOT EXISTS idx_shared_eligibility_pending_lookup
  ON shared_pool_eligibility_pending (
    eligibility_scope,
    product_key,
    region_bucket,
    combination_key
  );

-- Permanent eligibility flags contain only pool and combination keys. They do
-- not contain contributor IDs, hashes, tokens, counts, or contributor-derived values.
CREATE TABLE IF NOT EXISTS shared_pool_eligibility (
  eligibility_scope TEXT NOT NULL CHECK (
    eligibility_scope IN (
      'product',
      'product_region',
      'combination_product',
      'combination_region'
    )
  ),
  product_key TEXT NOT NULL,
  region_bucket TEXT NOT NULL DEFAULT '',
  combination_key TEXT NOT NULL DEFAULT '',
  eligible_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (
    eligibility_scope,
    product_key,
    region_bucket,
    combination_key
  )
);
CREATE INDEX IF NOT EXISTS idx_shared_eligibility_lookup
  ON shared_pool_eligibility (
    eligibility_scope,
    product_key,
    region_bucket,
    combination_key
  );

CREATE TABLE IF NOT EXISTS shared_layer2_migration_quarantine (
  source_contribution_id TEXT PRIMARY KEY,
  quarantine_reason TEXT NOT NULL,
  product_key TEXT,
  product_name_normalized TEXT,
  body_tags_json TEXT,
  mind_tags_json TEXT,
  mood_tags_json TEXT,
  submitted_at TEXT,
  quarantined_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_shared_quarantine_expires_at
  ON shared_layer2_migration_quarantine (expires_at);

CREATE TABLE IF NOT EXISTS shared_layer2_migration_audit (
  migration_key TEXT PRIMARY KEY,
  source_row_count INTEGER NOT NULL DEFAULT 0,
  opted_out_rows_deleted INTEGER NOT NULL DEFAULT 0,
  duplicate_rows_merged INTEGER NOT NULL DEFAULT 0,
  quarantined_rows INTEGER NOT NULL DEFAULT 0,
  quarantine_orphaned_rows INTEGER NOT NULL DEFAULT 0,
  quarantine_empty_product_key_rows INTEGER NOT NULL DEFAULT 0,
  quarantine_malformed_effect_rows INTEGER NOT NULL DEFAULT 0,
  quarantine_invalid_timestamp_rows INTEGER NOT NULL DEFAULT 0,
  valid_unique_rows INTEGER NOT NULL DEFAULT 0,
  expected_staging_rows INTEGER NOT NULL DEFAULT 0,
  actual_staging_rows INTEGER NOT NULL DEFAULT 0,
  expected_folded_rows INTEGER NOT NULL DEFAULT 0,
  combination_total INTEGER NOT NULL DEFAULT 0,
  product_total INTEGER NOT NULL DEFAULT 0,
  expected_product_region_total INTEGER NOT NULL DEFAULT 0,
  product_region_total INTEGER NOT NULL DEFAULT 0,
  expected_product_pending INTEGER NOT NULL DEFAULT 0,
  actual_product_pending INTEGER NOT NULL DEFAULT 0,
  expected_product_region_pending INTEGER NOT NULL DEFAULT 0,
  actual_product_region_pending INTEGER NOT NULL DEFAULT 0,
  expected_combination_product_pending INTEGER NOT NULL DEFAULT 0,
  actual_combination_product_pending INTEGER NOT NULL DEFAULT 0,
  expected_combination_region_pending INTEGER NOT NULL DEFAULT 0,
  actual_combination_region_pending INTEGER NOT NULL DEFAULT 0,
  unexpected_eligibility_rows INTEGER NOT NULL DEFAULT 0,
  approximate_count_mismatches INTEGER NOT NULL DEFAULT 0,
  quarantine_expiry_mismatches INTEGER NOT NULL DEFAULT 0,
  aggregate_row_count INTEGER NOT NULL DEFAULT 0,
  old_table_dropped INTEGER NOT NULL DEFAULT 1,
  completed_at TEXT
);

INSERT INTO shared_layer2_migration_audit (
  migration_key, old_table_dropped, completed_at
) VALUES (
  'layer2_aggregate_redesign_v4', 1, CURRENT_TIMESTAMP
)
ON CONFLICT(migration_key) DO NOTHING;
