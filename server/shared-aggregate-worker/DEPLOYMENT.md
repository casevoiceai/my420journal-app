# Layer 2 aggregate redesign deployment

This change includes an irreversible production data migration. Review the migration audit logic and take a D1 Time Travel bookmark before applying it.

## Required order

1. Back up or bookmark the production D1 database.
2. Apply `migrations/0002_layer2_aggregate_redesign.sql` to a non-production copy first.
3. Query `shared_layer2_migration_audit` and confirm:
   - `source_row_count` reconciles to opted-out, quarantined, duplicate-merged, and valid rows.
   - `actual_staging_rows` equals `expected_staging_rows`.
   - `combination_total` and `product_total` equal `expected_folded_rows`.
   - `product_region_total` equals `expected_product_region_total`.
   - Each actual eligibility count equals its matching expected eligibility count.
   - `approximate_count_mismatches` is `0`.
   - `quarantine_expiry_mismatches` is `0`.
   - `old_table_dropped` is `1`.
   - `completed_at` is populated.
4. Inspect every row in `shared_layer2_migration_quarantine` and its reason before production use.
5. Set a Worker secret named `ADMIN_TOKEN` to a strong random value.
6. Deploy the redesigned Worker.
7. Configure the existing hourly Cron Trigger as already planned: `0 * * * *`.
8. Test submission, duplicate handling, retraction, opt-out, eligibility, aging, aggregate reads, and quarantine expiration before broad release.

The migration contains a CHECK-based verification guard. Wrangler rolls the migration back if any source-row outcome, staging total, aggregate scope, eligibility count, approximate migration-time contributor count, or quarantine expiration check fails to reconcile.

## Eligibility design

Eligibility is checked against contributor IDs that are currently present in the temporary staging table, including rows that have not yet reached 72 hours. The check is transient. No contributor list, token, hash, or other contributor-derived membership value is stored.

The only permanent result is a simple eligibility flag containing the product, optional region, optional detailed combination key, and the time the threshold was first met.

Thresholds are:

- Product pool: 10 distinct staged contributor IDs.
- Product-region pool: 25 distinct staged contributor IDs.
- Detailed combination in a product view: 10 distinct staged contributor IDs.
- Detailed combination in a product-region view: 25 distinct staged contributor IDs.

Once a flag is created, it remains eligible even when staging rows later fold or a contributor opts out. Eligibility does not need to be recalculated from permanent contributor records because no such records exist.

## Running contributor figure

The aggregate table keeps an approximate running contributor figure by adding each fold batch's distinct staged contributors. The same device can be counted again in a later fold batch. This number is for display context only and is never used to qualify or disqualify a pool.

## Quarantine retention

Migration quarantine rows default to a 30-day review window. The scheduled Worker deletes rows after `expires_at`, and an administrator can trigger the same expired-row purge through `POST /admin/purge-quarantine` with `Authorization: Bearer <ADMIN_TOKEN>`.

Thirty days is a business-policy default, not a legal conclusion. Daniel should confirm or change the review window before production migration.

## Submission behavior

An identical pending submission from the same contributor is acknowledged with HTTP 200 and `duplicate: true`; it is not stored twice. This prevents a client retry from creating a duplicate or repeatedly retrying an already accepted contribution.

The starting abuse cap is 20 staging submissions per contributor ID in a rolling 24-hour period.

## Manual aging test

The scheduled handler is the normal aging path. For a controlled test, call `POST /admin/fold-staging` with `Authorization: Bearer <ADMIN_TOKEN>`.
