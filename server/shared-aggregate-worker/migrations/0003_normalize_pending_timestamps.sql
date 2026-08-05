-- Normalize Layer 2 eligibility timestamps so pending_since always uses the
-- same ISO-8601 UTC convention as staging submitted_at values.
--
-- Migration 0002 may have created pending_since with SQLite CURRENT_TIMESTAMP
-- (YYYY-MM-DD HH:MM:SS). Convert those rows before the Worker can compare them.
UPDATE shared_pool_eligibility_pending
SET pending_since = strftime('%Y-%m-%dT%H:%M:%fZ', pending_since)
WHERE datetime(pending_since) IS NOT NULL;

-- Keep future SQL inserts and updates in the same format, including manual or
-- migration-time writes that use SQLite's space-separated timestamp format.
CREATE TRIGGER IF NOT EXISTS trg_shared_pending_timestamp_insert
AFTER INSERT ON shared_pool_eligibility_pending
FOR EACH ROW
WHEN datetime(NEW.pending_since) IS NOT NULL
  AND NEW.pending_since <> strftime('%Y-%m-%dT%H:%M:%fZ', NEW.pending_since)
BEGIN
  UPDATE shared_pool_eligibility_pending
  SET pending_since = strftime('%Y-%m-%dT%H:%M:%fZ', NEW.pending_since)
  WHERE eligibility_scope = NEW.eligibility_scope
    AND product_key = NEW.product_key
    AND region_bucket = NEW.region_bucket
    AND combination_key = NEW.combination_key;
END;

CREATE TRIGGER IF NOT EXISTS trg_shared_pending_timestamp_update
AFTER UPDATE OF pending_since ON shared_pool_eligibility_pending
FOR EACH ROW
WHEN datetime(NEW.pending_since) IS NOT NULL
  AND NEW.pending_since <> strftime('%Y-%m-%dT%H:%M:%fZ', NEW.pending_since)
BEGIN
  UPDATE shared_pool_eligibility_pending
  SET pending_since = strftime('%Y-%m-%dT%H:%M:%fZ', NEW.pending_since)
  WHERE eligibility_scope = NEW.eligibility_scope
    AND product_key = NEW.product_key
    AND region_bucket = NEW.region_bucket
    AND combination_key = NEW.combination_key;
END;
