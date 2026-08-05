-- Apply before deploying the redesigned Worker.
-- This migration validates and classifies every legacy row before the old
-- individual-contribution table is removed. Any failed safety check rolls
-- the migration back when run through the documented D1 migration command.

PRAGMA defer_foreign_keys = on;

-- This table existed only in the rejected development design. It is removed
-- if present and is not recreated anywhere in this migration.
DROP TABLE IF EXISTS shared_aggregate_memberships;

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
  PRIMARY KEY (contributor_id, combination_key, submitted_at)
);

CREATE INDEX idx_shared_staging_submitted_at
  ON shared_contribution_staging (submitted_at);
CREATE INDEX idx_shared_staging_contributor_submitted
  ON shared_contribution_staging (contributor_id, submitted_at);
CREATE INDEX idx_shared_staging_product_region_combination
  ON shared_contribution_staging (product_key, region_bucket, combination_key);

CREATE TABLE shared_contributor_suppressions (
  contributor_id TEXT PRIMARY KEY,
  suppressed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reason TEXT NOT NULL DEFAULT 'user_opt_out'
);

CREATE TABLE shared_contributor_creation_events (
  event_id TEXT PRIMARY KEY,
  source_key TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT NOT NULL
);
CREATE INDEX idx_shared_creation_events_source_created
  ON shared_contributor_creation_events (source_key, created_at);
CREATE INDEX idx_shared_creation_events_expires
  ON shared_contributor_creation_events (expires_at);

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

-- Threshold crossing starts a confirmation period. This table stores only pool
-- metadata and a pending timestamp; no contributor ID or count is retained.
CREATE TABLE shared_pool_eligibility_pending (
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

CREATE INDEX idx_shared_eligibility_pending_lookup
  ON shared_pool_eligibility_pending (
    eligibility_scope,
    product_key,
    region_bucket,
    combination_key
  );

-- Permanent eligibility flags are created later by the Worker only after a
-- fresh threshold check at least 24 hours after pending_since.
CREATE TABLE shared_pool_eligibility (
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

CREATE INDEX idx_shared_eligibility_lookup
  ON shared_pool_eligibility (
    eligibility_scope,
    product_key,
    region_bucket,
    combination_key
  );

CREATE TABLE shared_layer2_migration_quarantine (
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

CREATE INDEX idx_shared_quarantine_expires_at
  ON shared_layer2_migration_quarantine (expires_at);

CREATE TABLE shared_layer2_migration_audit (
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
  old_table_dropped INTEGER NOT NULL DEFAULT 0,
  completed_at TEXT
);

INSERT INTO shared_layer2_migration_audit (migration_key, source_row_count)
SELECT 'layer2_aggregate_redesign_v4', COUNT(*)
FROM shared_product_contributions;

-- Preserve the block on contributor IDs that had already opted out.
INSERT OR IGNORE INTO shared_contributor_suppressions (
  contributor_id, suppressed_at, reason
)
SELECT
  anonymous_contributor_id,
  COALESCE(opted_out_at, CURRENT_TIMESTAMP),
  'legacy_opt_out'
FROM shared_contributors
WHERE is_active = 0;

-- Build a temporary normalized view of the legacy rows. A tag field is valid
-- only when it is a JSON array made entirely of strings. Arrays containing
-- numbers, objects, booleans, or null are quarantined instead of cleaned.
CREATE TABLE shared_layer2_legacy_normalized AS
SELECT
  c.contribution_id AS source_contribution_id,
  c.anonymous_contributor_id AS contributor_id,
  CASE WHEN sc.anonymous_contributor_id IS NULL THEN 0 ELSE 1 END AS contributor_exists,
  sc.is_active AS is_active,
  lower(trim(COALESCE(c.product_key, ''))) AS product_key,
  trim(COALESCE(c.product_name_normalized, c.product_key, '')) AS product_name_normalized,
  NULLIF(trim(COALESCE(c.brand_name, '')), '') AS brand_name,
  NULLIF(trim(COALESCE(c.category, '')), '') AS product_category,
  NULLIF(trim(COALESCE(c.strain_type, '')), '') AS strain_type,
  NULLIF(trim(COALESCE(c.region_bucket, '')), '') AS region_bucket,
  CASE
    WHEN json_valid(c.body_tags_json) = 1
      AND json_type(c.body_tags_json) = 'array'
      AND NOT EXISTS (
        SELECT 1 FROM json_each(c.body_tags_json) WHERE type <> 'text'
      )
    THEN COALESCE((
      SELECT json_group_array(tag)
      FROM (
        SELECT DISTINCT trim(value) AS tag
        FROM json_each(c.body_tags_json)
        WHERE trim(value) <> ''
        ORDER BY tag
      )
    ), '[]')
    ELSE c.body_tags_json
  END AS body_tags_json,
  CASE
    WHEN json_valid(c.mind_tags_json) = 1
      AND json_type(c.mind_tags_json) = 'array'
      AND NOT EXISTS (
        SELECT 1 FROM json_each(c.mind_tags_json) WHERE type <> 'text'
      )
    THEN COALESCE((
      SELECT json_group_array(tag)
      FROM (
        SELECT DISTINCT trim(value) AS tag
        FROM json_each(c.mind_tags_json)
        WHERE trim(value) <> ''
        ORDER BY tag
      )
    ), '[]')
    ELSE c.mind_tags_json
  END AS mind_tags_json,
  CASE
    WHEN json_valid(c.mood_tags_json) = 1
      AND json_type(c.mood_tags_json) = 'array'
      AND NOT EXISTS (
        SELECT 1 FROM json_each(c.mood_tags_json) WHERE type <> 'text'
      )
    THEN COALESCE((
      SELECT json_group_array(tag)
      FROM (
        SELECT DISTINCT trim(value) AS tag
        FROM json_each(c.mood_tags_json)
        WHERE trim(value) <> ''
        ORDER BY tag
      )
    ), '[]')
    ELSE c.mood_tags_json
  END AS mood_tags_json,
  NULLIF(trim(COALESCE(c.mood_face, '')), '') AS mood_face,
  NULLIF(trim(COALESCE(c.amount_bucket, '')), '') AS amount_bucket,
  NULLIF(trim(COALESCE(c.entry_logged_at_bucket, '')), '') AS time_bucket,
  NULLIF(trim(COALESCE(c.source_app_version, '')), '') AS app_version,
  c.created_at AS submitted_at,
  trim(
    CASE
      WHEN sc.anonymous_contributor_id IS NULL THEN 'orphaned_contributor|'
      ELSE ''
    END ||
    CASE
      WHEN trim(COALESCE(c.product_key, '')) = '' THEN 'empty_product_key|'
      ELSE ''
    END ||
    CASE
      WHEN NOT (
        json_valid(c.body_tags_json) = 1
        AND json_type(c.body_tags_json) = 'array'
        AND NOT EXISTS (
          SELECT 1 FROM json_each(c.body_tags_json) WHERE type <> 'text'
        )
      )
      OR NOT (
        json_valid(c.mind_tags_json) = 1
        AND json_type(c.mind_tags_json) = 'array'
        AND NOT EXISTS (
          SELECT 1 FROM json_each(c.mind_tags_json) WHERE type <> 'text'
        )
      )
      OR NOT (
        json_valid(c.mood_tags_json) = 1
        AND json_type(c.mood_tags_json) = 'array'
        AND NOT EXISTS (
          SELECT 1 FROM json_each(c.mood_tags_json) WHERE type <> 'text'
        )
      )
      THEN 'malformed_effect_tags|'
      ELSE ''
    END ||
    CASE
      WHEN datetime(c.created_at) IS NULL THEN 'invalid_created_at|'
      ELSE ''
    END,
    '|'
  ) AS quarantine_reason
FROM shared_product_contributions c
LEFT JOIN shared_contributors sc
  ON sc.anonymous_contributor_id = c.anonymous_contributor_id;

-- Rows belonging to users already opted out are deleted, not quarantined.
UPDATE shared_layer2_migration_audit
SET opted_out_rows_deleted = (
  SELECT COUNT(*)
  FROM shared_layer2_legacy_normalized
  WHERE contributor_exists = 1 AND is_active = 0
)
WHERE migration_key = 'layer2_aggregate_redesign_v4';

-- Active invalid rows and orphaned rows are isolated for manual review. The
-- default review window is 30 days; the Worker deletes expired rows.
INSERT INTO shared_layer2_migration_quarantine (
  source_contribution_id,
  quarantine_reason,
  product_key,
  product_name_normalized,
  body_tags_json,
  mind_tags_json,
  mood_tags_json,
  submitted_at,
  expires_at
)
SELECT
  source_contribution_id,
  quarantine_reason,
  product_key,
  product_name_normalized,
  body_tags_json,
  mind_tags_json,
  mood_tags_json,
  submitted_at,
  datetime('now', '+30 days')
FROM shared_layer2_legacy_normalized
WHERE (contributor_exists = 0 OR is_active = 1)
  AND quarantine_reason <> '';

UPDATE shared_layer2_migration_audit
SET
  quarantined_rows = (
    SELECT COUNT(*) FROM shared_layer2_migration_quarantine
  ),
  quarantine_orphaned_rows = (
    SELECT COUNT(*) FROM shared_layer2_migration_quarantine
    WHERE instr(quarantine_reason, 'orphaned_contributor') > 0
  ),
  quarantine_empty_product_key_rows = (
    SELECT COUNT(*) FROM shared_layer2_migration_quarantine
    WHERE instr(quarantine_reason, 'empty_product_key') > 0
  ),
  quarantine_malformed_effect_rows = (
    SELECT COUNT(*) FROM shared_layer2_migration_quarantine
    WHERE instr(quarantine_reason, 'malformed_effect_tags') > 0
  ),
  quarantine_invalid_timestamp_rows = (
    SELECT COUNT(*) FROM shared_layer2_migration_quarantine
    WHERE instr(quarantine_reason, 'invalid_created_at') > 0
  )
WHERE migration_key = 'layer2_aggregate_redesign_v4';

-- Prepare valid active rows with the same canonical combination key used by
-- the Worker. Timestamp remains outside the key so exact duplicate records
-- can be merged while separate entries at different times remain.
CREATE TABLE shared_layer2_valid_prepared AS
SELECT
  contributor_id,
  json_object(
    'scope', 'combination',
    'product_key', product_key,
    'product_name_normalized', product_name_normalized,
    'brand_name', brand_name,
    'product_category', product_category,
    'strain_type', strain_type,
    'region_bucket', region_bucket,
    'body_tags_json', body_tags_json,
    'mind_tags_json', mind_tags_json,
    'mood_tags_json', mood_tags_json,
    'mood_face', mood_face,
    'amount_bucket', amount_bucket,
    'time_bucket', time_bucket,
    'app_version', app_version
  ) AS combination_key,
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
  submitted_at
FROM shared_layer2_legacy_normalized
WHERE contributor_exists = 1
  AND is_active = 1
  AND quarantine_reason = '';

-- Merge exact duplicates: same contributor, same normalized contribution, and
-- same original timestamp. Separate real entries at different times remain.
CREATE TABLE shared_layer2_valid_deduped AS
SELECT
  contributor_id,
  combination_key,
  MAX(product_key) AS product_key,
  MAX(product_name_normalized) AS product_name_normalized,
  MAX(brand_name) AS brand_name,
  MAX(product_category) AS product_category,
  MAX(strain_type) AS strain_type,
  MAX(region_bucket) AS region_bucket,
  MAX(body_tags_json) AS body_tags_json,
  MAX(mind_tags_json) AS mind_tags_json,
  MAX(mood_tags_json) AS mood_tags_json,
  MAX(mood_face) AS mood_face,
  MAX(amount_bucket) AS amount_bucket,
  MAX(time_bucket) AS time_bucket,
  MAX(app_version) AS app_version,
  submitted_at,
  COUNT(*) AS source_row_count
FROM shared_layer2_valid_prepared
GROUP BY contributor_id, combination_key, submitted_at;

UPDATE shared_layer2_migration_audit
SET
  duplicate_rows_merged = COALESCE((
    SELECT SUM(source_row_count - 1)
    FROM shared_layer2_valid_deduped
  ), 0),
  valid_unique_rows = (
    SELECT COUNT(*) FROM shared_layer2_valid_deduped
  )
WHERE migration_key = 'layer2_aggregate_redesign_v4';

-- Preserve the original timestamp for rows that have not completed 72 hours.
INSERT INTO shared_contribution_staging (
  contributor_id,
  combination_key,
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
  submitted_at
)
SELECT
  contributor_id,
  combination_key,
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
  submitted_at
FROM shared_layer2_valid_deduped
WHERE datetime(submitted_at) > datetime('now', '-72 hours');

-- Migration can start a confirmation period, but it cannot create a permanent
-- eligibility flag. A later Worker check after the configured waiting period
-- must freshly confirm the threshold before promotion.
INSERT OR IGNORE INTO shared_pool_eligibility_pending (
  eligibility_scope, product_key, region_bucket, combination_key, pending_since
)
SELECT 'product', product_key, '', '', CURRENT_TIMESTAMP
FROM shared_contribution_staging
GROUP BY product_key
HAVING COUNT(DISTINCT contributor_id) >= 10;

INSERT OR IGNORE INTO shared_pool_eligibility_pending (
  eligibility_scope, product_key, region_bucket, combination_key, pending_since
)
SELECT 'product_region', product_key, region_bucket, '', CURRENT_TIMESTAMP
FROM shared_contribution_staging
WHERE region_bucket IS NOT NULL AND trim(region_bucket) <> ''
GROUP BY product_key, region_bucket
HAVING COUNT(DISTINCT contributor_id) >= 25;

INSERT OR IGNORE INTO shared_pool_eligibility_pending (
  eligibility_scope, product_key, region_bucket, combination_key, pending_since
)
SELECT 'combination_product', product_key, '', combination_key, CURRENT_TIMESTAMP
FROM shared_contribution_staging
GROUP BY product_key, combination_key
HAVING COUNT(DISTINCT contributor_id) >= 10;

INSERT OR IGNORE INTO shared_pool_eligibility_pending (
  eligibility_scope, product_key, region_bucket, combination_key, pending_since
)
SELECT 'combination_region', product_key, region_bucket, combination_key, CURRENT_TIMESTAMP
FROM shared_contribution_staging
WHERE region_bucket IS NOT NULL AND trim(region_bucket) <> ''
GROUP BY product_key, region_bucket, combination_key
HAVING COUNT(DISTINCT contributor_id) >= 25;

-- Rows at least 72 hours old are folded directly into permanent totals. The
-- contributor count is exact for this one migration batch but is explicitly an
-- approximate running figure once later fold batches are added.
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
  combination_key,
  'combination',
  MAX(product_key),
  MAX(product_name_normalized),
  MAX(brand_name),
  MAX(product_category),
  MAX(strain_type),
  MAX(region_bucket),
  MAX(body_tags_json),
  MAX(mind_tags_json),
  MAX(mood_tags_json),
  MAX(mood_face),
  MAX(amount_bucket),
  MAX(time_bucket),
  MAX(app_version),
  COUNT(*),
  COUNT(DISTINCT contributor_id),
  CURRENT_TIMESTAMP
FROM shared_layer2_valid_deduped
WHERE datetime(submitted_at) <= datetime('now', '-72 hours')
GROUP BY combination_key;

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
  COUNT(DISTINCT contributor_id),
  CURRENT_TIMESTAMP
FROM shared_layer2_valid_deduped
WHERE datetime(submitted_at) <= datetime('now', '-72 hours')
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
  json_object(
    'scope', 'product_region',
    'product_key', product_key,
    'region_bucket', region_bucket
  ),
  'product_region',
  product_key,
  MAX(product_name_normalized),
  region_bucket,
  COUNT(*),
  COUNT(DISTINCT contributor_id),
  CURRENT_TIMESTAMP
FROM shared_layer2_valid_deduped
WHERE datetime(submitted_at) <= datetime('now', '-72 hours')
  AND region_bucket IS NOT NULL
GROUP BY product_key, region_bucket;

UPDATE shared_layer2_migration_audit
SET
  expected_staging_rows = (
    SELECT COUNT(*)
    FROM shared_layer2_valid_deduped
    WHERE datetime(submitted_at) > datetime('now', '-72 hours')
  ),
  actual_staging_rows = (
    SELECT COUNT(*) FROM shared_contribution_staging
  ),
  expected_folded_rows = (
    SELECT COUNT(*)
    FROM shared_layer2_valid_deduped
    WHERE datetime(submitted_at) <= datetime('now', '-72 hours')
  ),
  combination_total = (
    SELECT COALESCE(SUM(total_count), 0)
    FROM shared_product_aggregates
    WHERE aggregate_scope = 'combination'
  ),
  product_total = (
    SELECT COALESCE(SUM(total_count), 0)
    FROM shared_product_aggregates
    WHERE aggregate_scope = 'product'
  ),
  expected_product_region_total = (
    SELECT COUNT(*)
    FROM shared_layer2_valid_deduped
    WHERE datetime(submitted_at) <= datetime('now', '-72 hours')
      AND region_bucket IS NOT NULL
  ),
  product_region_total = (
    SELECT COALESCE(SUM(total_count), 0)
    FROM shared_product_aggregates
    WHERE aggregate_scope = 'product_region'
  ),
  expected_product_pending = (
    SELECT COUNT(*) FROM (
      SELECT product_key
      FROM shared_contribution_staging
      GROUP BY product_key
      HAVING COUNT(DISTINCT contributor_id) >= 10
    )
  ),
  actual_product_pending = (
    SELECT COUNT(*) FROM shared_pool_eligibility_pending
    WHERE eligibility_scope = 'product'
  ),
  expected_product_region_pending = (
    SELECT COUNT(*) FROM (
      SELECT product_key, region_bucket
      FROM shared_contribution_staging
      WHERE region_bucket IS NOT NULL AND trim(region_bucket) <> ''
      GROUP BY product_key, region_bucket
      HAVING COUNT(DISTINCT contributor_id) >= 25
    )
  ),
  actual_product_region_pending = (
    SELECT COUNT(*) FROM shared_pool_eligibility_pending
    WHERE eligibility_scope = 'product_region'
  ),
  expected_combination_product_pending = (
    SELECT COUNT(*) FROM (
      SELECT product_key, combination_key
      FROM shared_contribution_staging
      GROUP BY product_key, combination_key
      HAVING COUNT(DISTINCT contributor_id) >= 10
    )
  ),
  actual_combination_product_pending = (
    SELECT COUNT(*) FROM shared_pool_eligibility_pending
    WHERE eligibility_scope = 'combination_product'
  ),
  expected_combination_region_pending = (
    SELECT COUNT(*) FROM (
      SELECT product_key, region_bucket, combination_key
      FROM shared_contribution_staging
      WHERE region_bucket IS NOT NULL AND trim(region_bucket) <> ''
      GROUP BY product_key, region_bucket, combination_key
      HAVING COUNT(DISTINCT contributor_id) >= 25
    )
  ),
  actual_combination_region_pending = (
    SELECT COUNT(*) FROM shared_pool_eligibility_pending
    WHERE eligibility_scope = 'combination_region'
  ),
  unexpected_eligibility_rows = (
    SELECT COUNT(*) FROM shared_pool_eligibility
  ),
  approximate_count_mismatches = (
    SELECT COUNT(*)
    FROM shared_product_aggregates aggregate_row
    WHERE aggregate_row.distinct_contributor_count <> CASE
      WHEN aggregate_row.aggregate_scope = 'combination' THEN (
        SELECT COUNT(DISTINCT contributor_id)
        FROM shared_layer2_valid_deduped source_row
        WHERE datetime(source_row.submitted_at) <= datetime('now', '-72 hours')
          AND source_row.combination_key = aggregate_row.combination_key
      )
      WHEN aggregate_row.aggregate_scope = 'product' THEN (
        SELECT COUNT(DISTINCT contributor_id)
        FROM shared_layer2_valid_deduped source_row
        WHERE datetime(source_row.submitted_at) <= datetime('now', '-72 hours')
          AND source_row.product_key = aggregate_row.product_key
      )
      WHEN aggregate_row.aggregate_scope = 'product_region' THEN (
        SELECT COUNT(DISTINCT contributor_id)
        FROM shared_layer2_valid_deduped source_row
        WHERE datetime(source_row.submitted_at) <= datetime('now', '-72 hours')
          AND source_row.product_key = aggregate_row.product_key
          AND source_row.region_bucket = aggregate_row.region_bucket
      )
      ELSE -1
    END
  ),
  quarantine_expiry_mismatches = (
    SELECT COUNT(*)
    FROM shared_layer2_migration_quarantine
    WHERE datetime(expires_at) IS NULL
      OR datetime(expires_at) <= datetime(quarantined_at)
  ),
  aggregate_row_count = (
    SELECT COUNT(*) FROM shared_product_aggregates
  )
WHERE migration_key = 'layer2_aggregate_redesign_v4';

-- Every legacy row must reconcile to one of four outcomes: opted out,
-- quarantined, merged as a duplicate, or retained as one valid row. Staging,
-- aggregate scopes, pending confirmation rows, approximate migration-time
-- counts, and quarantine expiration must also reconcile.
CREATE TABLE shared_layer2_migration_guard (
  is_valid INTEGER NOT NULL CHECK (is_valid = 1)
);

INSERT INTO shared_layer2_migration_guard (is_valid)
SELECT CASE
  WHEN source_row_count = (
    opted_out_rows_deleted
    + quarantined_rows
    + duplicate_rows_merged
    + valid_unique_rows
  )
  AND valid_unique_rows = expected_staging_rows + expected_folded_rows
  AND actual_staging_rows = expected_staging_rows
  AND combination_total = expected_folded_rows
  AND product_total = expected_folded_rows
  AND product_region_total = expected_product_region_total
  AND actual_product_pending = expected_product_pending
  AND actual_product_region_pending = expected_product_region_pending
  AND actual_combination_product_pending = expected_combination_product_pending
  AND actual_combination_region_pending = expected_combination_region_pending
  AND unexpected_eligibility_rows = 0
  AND approximate_count_mismatches = 0
  AND quarantine_expiry_mismatches = 0
  THEN 1
  ELSE 0
END
FROM shared_layer2_migration_audit
WHERE migration_key = 'layer2_aggregate_redesign_v4';

DROP TABLE shared_layer2_migration_guard;

DROP TABLE shared_product_contributions;
DROP TABLE shared_product_aggregates_legacy_summary;
DROP TABLE shared_layer2_valid_deduped;
DROP TABLE shared_layer2_valid_prepared;
DROP TABLE shared_layer2_legacy_normalized;

DELETE FROM shared_contributors
WHERE is_active = 0;

UPDATE shared_layer2_migration_audit
SET old_table_dropped = 1, completed_at = CURRENT_TIMESTAMP
WHERE migration_key = 'layer2_aggregate_redesign_v4';
