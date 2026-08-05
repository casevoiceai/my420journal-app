-- Apply before deploying the redesigned Worker.
-- This migration validates and classifies every legacy row before the old
-- individual-contribution table is removed. Any failed safety check rolls
-- the migration back.

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
  PRIMARY KEY (contributor_id, combination_key, submitted_at)
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

-- Each token is deterministic only inside one aggregate key. No raw contributor
-- ID or cross-pool contributor token is retained in this table.
CREATE TABLE shared_aggregate_memberships (
  aggregate_key TEXT NOT NULL,
  contributor_token TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (aggregate_key, contributor_token)
);

CREATE INDEX idx_shared_memberships_aggregate
  ON shared_aggregate_memberships (aggregate_key);

CREATE TABLE shared_layer2_migration_quarantine (
  source_contribution_id TEXT PRIMARY KEY,
  contributor_id TEXT,
  quarantine_reason TEXT NOT NULL,
  product_key TEXT,
  product_name_normalized TEXT,
  body_tags_json TEXT,
  mind_tags_json TEXT,
  mood_tags_json TEXT,
  submitted_at TEXT,
  quarantined_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

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
  expected_combination_memberships INTEGER NOT NULL DEFAULT 0,
  actual_combination_memberships INTEGER NOT NULL DEFAULT 0,
  expected_product_memberships INTEGER NOT NULL DEFAULT 0,
  actual_product_memberships INTEGER NOT NULL DEFAULT 0,
  expected_product_region_memberships INTEGER NOT NULL DEFAULT 0,
  actual_product_region_memberships INTEGER NOT NULL DEFAULT 0,
  distinct_count_mismatches INTEGER NOT NULL DEFAULT 0,
  aggregate_row_count INTEGER NOT NULL DEFAULT 0,
  old_table_dropped INTEGER NOT NULL DEFAULT 0,
  completed_at TEXT
);

INSERT INTO shared_layer2_migration_audit (migration_key, source_row_count)
SELECT 'layer2_aggregate_redesign_v2', COUNT(*)
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

-- Build a temporary normalized view of the legacy rows. Valid tag arrays are
-- deduplicated, stripped of blank values, sorted, and stored in canonical JSON.
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
    WHEN json_valid(c.body_tags_json) = 1 AND json_type(c.body_tags_json) = 'array'
    THEN COALESCE((
      SELECT json_group_array(tag)
      FROM (
        SELECT DISTINCT trim(value) AS tag
        FROM json_each(c.body_tags_json)
        WHERE type = 'text' AND trim(value) <> ''
        ORDER BY tag
      )
    ), '[]')
    ELSE c.body_tags_json
  END AS body_tags_json,
  CASE
    WHEN json_valid(c.mind_tags_json) = 1 AND json_type(c.mind_tags_json) = 'array'
    THEN COALESCE((
      SELECT json_group_array(tag)
      FROM (
        SELECT DISTINCT trim(value) AS tag
        FROM json_each(c.mind_tags_json)
        WHERE type = 'text' AND trim(value) <> ''
        ORDER BY tag
      )
    ), '[]')
    ELSE c.mind_tags_json
  END AS mind_tags_json,
  CASE
    WHEN json_valid(c.mood_tags_json) = 1 AND json_type(c.mood_tags_json) = 'array'
    THEN COALESCE((
      SELECT json_group_array(tag)
      FROM (
        SELECT DISTINCT trim(value) AS tag
        FROM json_each(c.mood_tags_json)
        WHERE type = 'text' AND trim(value) <> ''
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
      WHEN (
        CASE
          WHEN json_valid(c.body_tags_json) = 1
            THEN CASE WHEN json_type(c.body_tags_json) = 'array' THEN 0 ELSE 1 END
          ELSE 1
        END
        +
        CASE
          WHEN json_valid(c.mind_tags_json) = 1
            THEN CASE WHEN json_type(c.mind_tags_json) = 'array' THEN 0 ELSE 1 END
          ELSE 1
        END
        +
        CASE
          WHEN json_valid(c.mood_tags_json) = 1
            THEN CASE WHEN json_type(c.mood_tags_json) = 'array' THEN 0 ELSE 1 END
          ELSE 1
        END
      ) > 0 THEN 'malformed_effect_tags|'
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
WHERE migration_key = 'layer2_aggregate_redesign_v2';

-- Active invalid rows and orphaned rows are isolated for manual review.
INSERT INTO shared_layer2_migration_quarantine (
  source_contribution_id,
  contributor_id,
  quarantine_reason,
  product_key,
  product_name_normalized,
  body_tags_json,
  mind_tags_json,
  mood_tags_json,
  submitted_at
)
SELECT
  source_contribution_id,
  contributor_id,
  quarantine_reason,
  product_key,
  product_name_normalized,
  body_tags_json,
  mind_tags_json,
  mood_tags_json,
  submitted_at
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
WHERE migration_key = 'layer2_aggregate_redesign_v2';

-- Prepare valid active rows with the same canonical combination key used by
-- the Worker. Timestamp remains outside the key so exact duplicate records
-- can be merged while genuinely separate entries at different times remain.
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
WHERE migration_key = 'layer2_aggregate_redesign_v2';

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

-- Rows at least 72 hours old are folded directly into permanent totals.
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
  0,
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
  0,
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
  0,
  CURRENT_TIMESTAMP
FROM shared_layer2_valid_deduped
WHERE datetime(submitted_at) <= datetime('now', '-72 hours')
  AND region_bucket IS NOT NULL
GROUP BY product_key, region_bucket;

-- Build the exact lifetime membership set for the already-folded rows. The
-- scoped token algorithm is the same three-part deterministic transform used
-- by the Worker. The aggregate key is part of the input, so tokens cannot be
-- compared across different products, regions, or combinations.
CREATE TABLE shared_layer2_membership_sources (
  aggregate_key TEXT NOT NULL,
  contributor_id TEXT NOT NULL,
  aggregate_scope TEXT NOT NULL,
  PRIMARY KEY (aggregate_key, contributor_id)
);

INSERT OR IGNORE INTO shared_layer2_membership_sources (
  aggregate_key, contributor_id, aggregate_scope
)
SELECT combination_key, contributor_id, 'combination'
FROM shared_layer2_valid_deduped
WHERE datetime(submitted_at) <= datetime('now', '-72 hours');

INSERT OR IGNORE INTO shared_layer2_membership_sources (
  aggregate_key, contributor_id, aggregate_scope
)
SELECT
  json_object('scope', 'product', 'product_key', product_key),
  contributor_id,
  'product'
FROM shared_layer2_valid_deduped
WHERE datetime(submitted_at) <= datetime('now', '-72 hours');

INSERT OR IGNORE INTO shared_layer2_membership_sources (
  aggregate_key, contributor_id, aggregate_scope
)
SELECT
  json_object(
    'scope', 'product_region',
    'product_key', product_key,
    'region_bucket', region_bucket
  ),
  contributor_id,
  'product_region'
FROM shared_layer2_valid_deduped
WHERE datetime(submitted_at) <= datetime('now', '-72 hours')
  AND region_bucket IS NOT NULL;

WITH RECURSIVE membership_hash (
  aggregate_key,
  contributor_id,
  input_text,
  position,
  h1,
  h2,
  h3
) AS (
  SELECT
    aggregate_key,
    contributor_id,
    aggregate_key || '|' || contributor_id,
    1,
    17,
    29,
    43
  FROM shared_layer2_membership_sources

  UNION ALL

  SELECT
    aggregate_key,
    contributor_id,
    input_text,
    position + 1,
    ((h1 * 131) + unicode(substr(input_text, position, 1))) % 2147483647,
    ((h2 * 137) + unicode(substr(input_text, position, 1))) % 2147483647,
    ((h3 * 149) + unicode(substr(input_text, position, 1))) % 2147483647
  FROM membership_hash
  WHERE position <= length(input_text)
)
INSERT OR IGNORE INTO shared_aggregate_memberships (
  aggregate_key, contributor_token
)
SELECT
  aggregate_key,
  CAST(h1 AS TEXT) || ':' || CAST(h2 AS TEXT) || ':' || CAST(h3 AS TEXT)
FROM membership_hash
WHERE position > length(input_text);

UPDATE shared_product_aggregates
SET distinct_contributor_count = (
  SELECT COUNT(*)
  FROM shared_aggregate_memberships membership
  WHERE membership.aggregate_key = shared_product_aggregates.combination_key
);

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
  expected_combination_memberships = (
    SELECT COUNT(*)
    FROM shared_layer2_membership_sources
    WHERE aggregate_scope = 'combination'
  ),
  actual_combination_memberships = (
    SELECT COUNT(*)
    FROM shared_aggregate_memberships membership
    INNER JOIN shared_product_aggregates aggregate_row
      ON aggregate_row.combination_key = membership.aggregate_key
    WHERE aggregate_row.aggregate_scope = 'combination'
  ),
  expected_product_memberships = (
    SELECT COUNT(*)
    FROM shared_layer2_membership_sources
    WHERE aggregate_scope = 'product'
  ),
  actual_product_memberships = (
    SELECT COUNT(*)
    FROM shared_aggregate_memberships membership
    INNER JOIN shared_product_aggregates aggregate_row
      ON aggregate_row.combination_key = membership.aggregate_key
    WHERE aggregate_row.aggregate_scope = 'product'
  ),
  expected_product_region_memberships = (
    SELECT COUNT(*)
    FROM shared_layer2_membership_sources
    WHERE aggregate_scope = 'product_region'
  ),
  actual_product_region_memberships = (
    SELECT COUNT(*)
    FROM shared_aggregate_memberships membership
    INNER JOIN shared_product_aggregates aggregate_row
      ON aggregate_row.combination_key = membership.aggregate_key
    WHERE aggregate_row.aggregate_scope = 'product_region'
  ),
  distinct_count_mismatches = (
    SELECT COUNT(*)
    FROM shared_product_aggregates aggregate_row
    WHERE aggregate_row.distinct_contributor_count <> (
      SELECT COUNT(*)
      FROM shared_aggregate_memberships membership
      WHERE membership.aggregate_key = aggregate_row.combination_key
    )
  ),
  aggregate_row_count = (
    SELECT COUNT(*) FROM shared_product_aggregates
  )
WHERE migration_key = 'layer2_aggregate_redesign_v2';

-- Every legacy row must reconcile to one of four outcomes:
-- opted out, quarantined, merged as a duplicate, or retained as one valid row.
-- Each aggregate scope and each membership count must also reconcile.
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
  AND actual_combination_memberships = expected_combination_memberships
  AND actual_product_memberships = expected_product_memberships
  AND actual_product_region_memberships = expected_product_region_memberships
  AND distinct_count_mismatches = 0
  THEN 1
  ELSE 0
END
FROM shared_layer2_migration_audit
WHERE migration_key = 'layer2_aggregate_redesign_v2';

DROP TABLE shared_layer2_migration_guard;

DROP TABLE shared_product_contributions;
DROP TABLE shared_product_aggregates_legacy_summary;
DROP TABLE shared_layer2_membership_sources;
DROP TABLE shared_layer2_valid_deduped;
DROP TABLE shared_layer2_valid_prepared;
DROP TABLE shared_layer2_legacy_normalized;

DELETE FROM shared_contributors
WHERE is_active = 0;

UPDATE shared_layer2_migration_audit
SET old_table_dropped = 1, completed_at = CURRENT_TIMESTAMP
WHERE migration_key = 'layer2_aggregate_redesign_v2';
