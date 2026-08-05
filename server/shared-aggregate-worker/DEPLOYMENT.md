# Layer 2 aggregate redesign deployment

This change includes an irreversible production data migration. Review the migration audit logic and take a D1 Time Travel bookmark before applying it.

## Required order

1. Back up or bookmark the production D1 database.
2. Apply `migrations/0002_layer2_aggregate_redesign.sql` to the production D1 database.
3. Query `shared_layer2_migration_audit` and confirm:
   - `source_row_count` reconciles to opted-out, quarantined, duplicate-merged, and valid rows.
   - `actual_staging_rows` equals `expected_staging_rows`.
   - `combination_total` and `product_total` equal `expected_folded_rows`.
   - `product_region_total` equals `expected_product_region_total`.
   - Every actual membership count equals its matching expected membership count.
   - `distinct_count_mismatches` is `0`.
   - `old_table_dropped` is `1`.
   - `completed_at` is populated.
4. Set a Worker secret named `ADMIN_TOKEN` to a strong random value.
5. Deploy the redesigned Worker.
6. Configure an hourly Cron Trigger: `0 * * * *`.
7. Test submission, duplicate handling, retraction, opt-out, aging, and aggregate thresholds before broad release.

The migration contains a CHECK-based verification guard. Wrangler rolls the migration back if any legacy row, staging total, aggregate scope, membership count, or distinct-contributor count fails to reconcile.

## Submission behavior

An identical pending submission from the same contributor is acknowledged with HTTP 200 and `duplicate: true`; it is not stored twice. This prevents a client retry from creating a duplicate or repeatedly retrying an already accepted contribution.

The starting abuse cap is 20 staging submissions per contributor ID in a rolling 24-hour period.

## Distinct contributor counting

Each aggregate key stores only a pool-scoped deterministic membership token. The raw contributor ID is not stored with the permanent aggregate or membership record, and tokens from different products, regions, or combinations cannot be compared with each other.

A contributor can therefore increase a given product, product-region, or combination threshold only once across all folding runs. The aggregate API reports these lifetime distinct-contributor counts as exact for the anonymous contributor ID used by the device.

## Manual aging test

The scheduled handler is the normal aging path. For a controlled test, call `POST /admin/fold-staging` with `Authorization: Bearer <ADMIN_TOKEN>`.
