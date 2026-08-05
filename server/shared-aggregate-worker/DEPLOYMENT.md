# Layer 2 aggregate redesign deployment

This change includes an irreversible production data migration. Review the migration audit logic and take a D1 Time Travel bookmark before applying it.

## Required migration order

Both of these migration files are required and must be applied in this order:

1. `migrations/0002_layer2_aggregate_redesign.sql`
2. `migrations/0003_normalize_pending_timestamps.sql`

Do not skip migration `0003`. Migration `0002` can create `pending_since` values using SQLite's space-separated timestamp format. Migration `0003` converts those values to the ISO-8601 UTC format used by staged `submitted_at` values and installs the normalization triggers. Skipping `0003` leaves timestamp formats inconsistent and can produce incorrect eligibility results.

Use the database name rather than a binding name where possible, and apply all unapplied migrations with the current Wrangler command:

```bash
npx wrangler d1 migrations apply <DATABASE_NAME> --remote
```

Wrangler applies migration files in filename order. Each migration is a separate migration unit. If `0003` fails after `0002` succeeds, `0002` remains applied.

## Mandatory post-migration verification

Run this verification immediately after both migrations and before deploying, connecting, or pointing any Worker at the database.

### 1. Confirm both migrations are recorded as applied

The default migrations table is `d1_migrations`. If the Wrangler configuration uses a custom `migrations_table`, query that table instead.

```bash
npx wrangler d1 execute <DATABASE_NAME> --remote --command="SELECT name FROM d1_migrations WHERE name IN ('0002_layer2_aggregate_redesign.sql', '0003_normalize_pending_timestamps.sql') ORDER BY name;"
```

The result must contain both names:

- `0002_layer2_aggregate_redesign.sql`
- `0003_normalize_pending_timestamps.sql`

Also run:

```bash
npx wrangler d1 migrations list <DATABASE_NAME> --remote
```

Neither `0002` nor `0003` may appear in the list of unapplied migrations.

### 2. Confirm both timestamp-normalization triggers exist

```bash
npx wrangler d1 execute <DATABASE_NAME> --remote --command="SELECT name FROM sqlite_master WHERE type = 'trigger' AND name IN ('trg_shared_pending_timestamp_insert', 'trg_shared_pending_timestamp_update') ORDER BY name;"
```

The result must contain both trigger names:

- `trg_shared_pending_timestamp_insert`
- `trg_shared_pending_timestamp_update`

### 3. Confirm no pending timestamp remains in the old format

```bash
npx wrangler d1 execute <DATABASE_NAME> --remote --command="SELECT COUNT(*) AS old_space_format_count FROM shared_pool_eligibility_pending WHERE pending_since LIKE '____-__-__ __:__:__%';"
```

`old_space_format_count` must be `0`.

For an additional format check, run:

```bash
npx wrangler d1 execute <DATABASE_NAME> --remote --command="SELECT COUNT(*) AS non_iso_pending_count FROM shared_pool_eligibility_pending WHERE pending_since NOT GLOB '????-??-??T??:??:??.???Z';"
```

`non_iso_pending_count` must also be `0`.

Do not proceed until every verification above passes cleanly.

## Failure handling for migration 0003

If migration `0003_normalize_pending_timestamps.sql` fails for any reason after migration `0002_layer2_aggregate_redesign.sql` has already succeeded:

1. Do not deploy or point any Worker at that database.
2. Do not treat the database as migration-complete.
3. Correct the cause of the failure if necessary.
4. Rerun the standard migration command:

```bash
npx wrangler d1 migrations apply <DATABASE_NAME> --remote
```

Migration `0003` is safe to reapply. Its data normalization is idempotent, and its triggers use `IF NOT EXISTS`. Proceed only after the mandatory verification section confirms both migration records, both triggers, and zero old-format pending timestamps.

## Required deployment order

1. Back up or bookmark the production D1 database.
2. Create or select a non-production copy that is isolated from all live Worker traffic.
3. Apply both migrations, in order, to that isolated copy using the standard Wrangler migration command.
4. Complete every mandatory post-migration verification above.
5. Query `shared_layer2_migration_audit` and confirm:
   - `source_row_count` reconciles to opted-out, quarantined, duplicate-merged, and valid rows.
   - `actual_staging_rows` equals `expected_staging_rows`.
   - `combination_total` and `product_total` equal `expected_folded_rows`.
   - `product_region_total` equals `expected_product_region_total`.
   - Each actual eligibility count equals its matching expected eligibility count.
   - `approximate_count_mismatches` is `0`.
   - `quarantine_expiry_mismatches` is `0`.
   - `old_table_dropped` is `1`.
   - `completed_at` is populated.
6. Inspect every row in `shared_layer2_migration_quarantine` and its reason before production use.
7. Set a Worker secret named `ADMIN_TOKEN` to a strong random value.
8. Set a strong, nonempty Worker secret named `CONTRIBUTOR_RATE_LIMIT_SALT`.
9. Deploy the redesigned Worker only after the migration and verification steps pass.
10. Configure the existing hourly Cron Trigger as already planned: `0 * * * *`.
11. Test submission, duplicate handling, retraction, opt-out, eligibility, aging, aggregate reads, and quarantine expiration before broad release.

The migration contains a CHECK-based verification guard. Wrangler rolls back the migration that fails, but previous successful migrations remain applied. That is why migration `0003` and the mandatory verification steps cannot be skipped.

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
