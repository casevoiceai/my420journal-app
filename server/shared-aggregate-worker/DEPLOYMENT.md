# Layer 2 aggregate redesign deployment

This change includes an irreversible production data migration. Review the migration audit logic and take a D1 Time Travel bookmark before applying it.

## Required order

1. Back up or bookmark the production D1 database.
2. Apply `migrations/0002_layer2_aggregate_redesign.sql` to the production D1 database.
3. Query `shared_layer2_migration_audit` and confirm:
   - `old_row_count` equals `aggregate_total`.
   - `old_table_dropped` is `1`.
   - `completed_at` is populated.
   - `opted_out_rows_deleted` matches the number of legacy rows already pending deletion.
4. Set a Worker secret named `ADMIN_TOKEN` to a strong random value.
5. Deploy the redesigned Worker.
6. Configure an hourly Cron Trigger: `0 * * * *`.
7. Test submission, duplicate handling, retraction, opt-out, aging, and aggregate thresholds before broad release.

The migration contains a CHECK-based verification guard. Wrangler rolls the migration back if retained legacy row totals do not match the new combination totals.

## Submission behavior

An identical pending submission from the same contributor is acknowledged with HTTP 200 and `duplicate: true`; it is not stored twice. This prevents a client retry from creating a duplicate or repeatedly retrying an already accepted contribution.

The starting abuse cap is 20 staging submissions per contributor ID in a rolling 24-hour period.

## Distinct contributor limitation

Historical distinct-contributor counts are exact at migration. After migration, the aging job increments each product and product-region pool once per contributor represented in that aging run. Since contributor IDs are deleted after folding, the same contributor can be counted again in a later aging run. The aggregate API explicitly marks these counts as approximate.

## Manual aging test

The scheduled handler is the normal aging path. For a controlled test, call `POST /admin/fold-staging` with `Authorization: Bearer <ADMIN_TOKEN>`.
