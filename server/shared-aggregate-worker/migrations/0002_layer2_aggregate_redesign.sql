-- Apply before deploying the redesigned Worker.
-- Wrangler rolls back the migration if any statement fails, including the
-- count-verification CHECK near the end of this file.

PRAGMA defer_foreign_keys = on;

ALTER TABLE shared_product_aggregates
  RENAME TO shared_product_aggregates_legacy_summary;

CREATE TABLE shared_contribution_staging (
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

CREATE INDEX idx_shared_staging_submitted_at
  ON shared_contribution_staging (submitted_at);
CREATE INDEX idx_shared_staging_contributor_submitted
  ON shared_contribution_staging (contributor_id, submitted_at);

CREATE TABLE shared_contributor_suppressions (
  contributor_id TEXT PRIMARY KEY,
  suppressed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reason TEXT NOT NULL DEFAULT 'user_opt_out'
);

CREATE TABLE shared_product_aggregates (
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

CREATE INDEX idx_shared_aggregates_scope_product
  ON shared_product_aggregates (aggregate_scope, product_key);
CREATE INDEX idx_shared_aggregates_scope_product_region
  ON shared_product_aggregates (aggregate_scope, product_key, region_bucket);

CREATE TABLE shared_layer2_migration_audit (
  migration_key TEXT PRIMARY KEY,
  opted_out_rows_deleted INTEGER NOT NULL DEFAULT 0,
  old_row_count INTEGER NOT NULL DEFAULT 0,
  aggregate_total INTEGER NOT NULL DEFAULT 0,
  aggregate_row_count INTEGER NOT NULL DEFAULT 0,
  old_table_dropped INTEGER NOT NULL DEFAULT 0,
  completed_at TEXT
);

-- Preserve the block on contributor IDs that had already opted out.
INSERT INTO shared_contributor_suppressions (contributor_id, suppressed_at, reason)
SELECT anonymous_contributor_id, COALESCE(opted_out_at, CURRENT_TIMESTAMP), 'legacy_opt_out'
FROM shared_contributors
WHERE is_active = 0;

-- These rows were already pending deletion and excluded from live aggregates.
-- Folding them would reverse an existing opt-out.
INSERT INTO shared_layer2_migration_audit (migration_key, opted_out_rows_deleted)
SELECT
  'layer2_aggregate_redesign_v1',
  COUNT(*)
FROM shared_product_contributions c
INNER JOIN shared_contributors sc
  ON sc.anonymous_contributor_id = c.anonymous_contributor_id
WHERE sc.is_active = 0;

DELETE FROM shared_product_contributions
WHERE anonymous_contributor_id IN (
  SELECT anonymous_contributor_id
  FROM shared_contributors
  WHERE is_active = 0
);

DELETE FROM shared_contributors
WHERE is_active = 0;

UPDATE shared_layer2_migration_audit
SET old_row_count = (SELECT COUNT(*) FROM shared_product_contributions)
WHERE migration_key = 'layer2_aggregate_redesign_v1';

INSERT INTO shared_product_aggregates (
  combination_key,
  aggregate_scope,
  product_key,
  product_name_normalized,
  brand_name,
  product_category,
  strain_type,
  region_bucket,
  body_tags_json,
  mind_tags_json,
  mood_tags_json,
  mood_face,
  amount_bucket,
  time_bucket,
  app_version,
  total_count,
  distinct_contributor_count,
  last_updated
)
SELECT
  json_object(
    'scope', 'combination',
    'product_key', product_key,
    'product_name_normalized', product_name_normalized,
    'brand_name', brand_name,
    'product_category', category,
    'strain_type', strain_type,
    'region_bucket', region_bucket,
    'body_tags_json', body_tags_json,
    'mind_tags_json', mind_tags_json,
    'mood_tags_json', mood_tags_json,
    'mood_face', mood_face,
    'amount_bucket', amount_bucket,
    'time_bucket', entry_logged_at_bucket,
    'app_version', source_app_version
  ),
  'combination',
  product_key,
  MAX(product_name_normalized),
  MAX(brand_name),
  MAX(category),
  MAX(strain_type),
  MAX(region_bucket),
  MAX(body_tags_json),
  MAX(mind_tags_json),
  MAX(mood_tags_json),
  MAX(mood_face),
  MAX(amount_bucket),
  MAX(entry_logged_at_bucket),
  MAX(source_app_version),
  COUNT(*),
  COUNT(DISTINCT anonymous_contributor_id),
  CURRENT_TIMESTAMP
FROM shared_product_contributions
GROUP BY json_object(
  'scope', 'combination',
  'product_key', product_key,
  'product_name_normalized', product_name_normalized,
  'brand_name', brand_name,
  'product_category', category,
  'strain_type', strain_type,
  'region_bucket', region_bucket,
  'body_tags_json', body_tags_json,
  'mind_tags_json', mind_tags_json,
  'mood_tags_json', mood_tags_json,
  'mood_face', mood_face,
  'amount_bucket', amount_bucket,
  'time_bucket', entry_logged_at_bucket,
  'app_version', source_app_version
);

INSERT INTO shared_product_aggregates (
  combination_key,
  aggregate_scope,
  product_key,
  product_name_normalized,
  total_count,
  distinct_contributor_count,
  last_updated
)
SELECT
  json_object('scope', 'product', 'product_key', product_key),
  'product',
  product_key,
  MAX(product_name_normalized),
  COUNT(*),
  COUNT(DISTINCT anonymous_contributor_id),
  CURRENT_TIMESTAMP
FROM shared_product_contributions
GROUP BY product_key;

INSERT INTO shared_product_aggregates (
  combination_key,
  aggregate_scope,
  product_key,
  product_name_normalized,
  region_bucket,
  total_count,
  distinct_contributor_count,
  last_updated
)
SELECT
  json_object('scope', 'product_region', 'product_key', product_key, 'region_bucket', region_bucket),
  'product_region',
  product_key,
  MAX(product_name_normalized),
  region_bucket,
  COUNT(*),
  COUNT(DISTINCT anonymous_contributor_id),
  CURRENT_TIMESTAMP
FROM shared_product_contributions
WHERE region_bucket IS NOT NULL
GROUP BY product_key, region_bucket;

UPDATE shared_layer2_migration_audit
SET
  aggregate_total = (
    SELECT COALESCE(SUM(total_count), 0)
    FROM shared_product_aggregates
    WHERE aggregate_scope = 'combination'
  ),
  aggregate_row_count = (SELECT COUNT(*) FROM shared_product_aggregates)
WHERE migration_key = 'layer2_aggregate_redesign_v1';

-- Force migration failure and rollback if any retained legacy row was lost or doubled.
CREATE TABLE shared_layer2_migration_guard (
  is_valid INTEGER NOT NULL CHECK (is_valid = 1)
);
INSERT INTO shared_layer2_migration_guard (is_valid)
SELECT CASE WHEN old_row_count = aggregate_total THEN 1 ELSE 0 END
FROM shared_layer2_migration_audit
WHERE migration_key = 'layer2_aggregate_redesign_v1';
DROP TABLE shared_layer2_migration_guard;

DROP TABLE shared_product_contributions;
DROP TABLE shared_product_aggregates_legacy_summary;

UPDATE shared_layer2_migration_audit
SET old_table_dropped = 1, completed_at = CURRENT_TIMESTAMP
WHERE migration_key = 'layer2_aggregate_redesign_v1';
