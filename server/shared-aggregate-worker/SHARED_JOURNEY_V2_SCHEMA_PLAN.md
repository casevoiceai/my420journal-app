# Shared Journey V2 schema plan

Status: design plan only. Not an executable migration. Shared Journey remains OFF.

## Design goal

After the staging window expires, production must have no permanent active contributor profile and no permanent contribution row that can be mapped back to a contributor.

## Proposed V2 tables

### `shared_contribution_staging`

Purpose: short-lived intake used only long enough to validate, abuse-control, threshold-check and fold approved data into aggregates.

Allowed fields:
- `staging_id` random UUID
- `contributor_token_hash` short-lived pseudonymous digest
- normalized product key/name fields needed for aggregation
- approved coarse region bucket when present
- approved categorical effect/tag values
- coarse amount/time buckets only when approved
- `submitted_at`
- `expires_at`
- source app version if operationally necessary

Forbidden fields:
- raw journal notes
- raw IP address
- exact location
- exact event timestamp from Layer 1
- name/email/account identifier
- permanent contributor/member foreign key

Retention: maximum approximately 72 hours. Code and tests must delete expired rows even if a scheduled job is delayed.

### `shared_product_aggregates`

Purpose: permanent aggregate-only output.

Keying should be limited to approved pool dimensions such as product and, only where safe, coarse region.

Allowed fields:
- aggregate key
- approved aggregate counters
- approved effect/tag counters or compact aggregate JSON
- eligibility state reference
- aggregate update timestamps

Forbidden fields:
- contributor IDs or hashes
- staging IDs
- raw contribution IDs
- raw IP/device identifiers
- exact individual timestamps
- raw journal content

### `shared_pool_eligibility`

Purpose: remember that a pool has passed the reviewed release threshold without exposing who caused it to pass.

Allowed fields:
- pool key
- eligibility state
- eligibility/confirmation timestamps
- policy version

Forbidden fields:
- contributor list
- contributor IDs/hashes
- exact sub-threshold counts exposed through API

Threshold baseline:
- product >= 10
- product + region >= 25

Eligibility logic must account for differencing attacks and must not make nearby/subset responses sufficient to infer a small group.

### `shared_suppression_tombstones`

Purpose: narrowly scoped persistent state only when needed to honor an opt-out/suppression request.

Allowed fields should be the minimum necessary, for example:
- suppression digest
- reason code
- created timestamp
- expiry/review timestamp if policy allows expiry

Must not contain:
- product history
- region history
- effect tags
- contribution history
- profile metadata

A suppression tombstone is not an active contributor profile and must never be reused as one.

### `shared_source_rate_events`

Purpose: short-lived abuse/rate-limit events.

Allowed only when needed for defensible abuse controls.

Requirements:
- no raw IP storage
- normalize source address before hashing
- required secret salt, no predictable fallback
- no product/region/contributor linkage unless explicitly justified
- bounded short TTL

### `shared_layer2_migration_audit`

Purpose: record migration-level facts, not user-level history.

May store migration counts, timestamps and version identifiers. Must not become a permanent copy of contributor/contribution data.

### `shared_layer2_migration_quarantine`

Purpose: temporary safety bucket for rows that cannot be migrated automatically.

Requirements:
- bounded retention
- access restricted
- no automatic release into aggregates
- explicit deletion/review deadline
- never treated as ordinary permanent production storage

## Tables that must not exist in approved V2

- persistent `shared_contributors` active-profile table
- permanent per-contribution table such as `shared_product_contributions`
- persistent membership-token table
- permanent user-to-product or user-to-region mapping table

## Aggregation transaction boundary

A successful aggregation batch should be designed so that:

1. eligible staging rows are read
2. aggregate counters are updated transactionally where supported
3. eligibility state is updated consistently
4. successfully folded staging rows are deleted or allowed only until their strict expiry deadline
5. no permanent contributor mapping is created as a side effect

Failure must not produce a false client success.

## Migration rule

Do not write a production migration until the target Worker logic and this schema are reviewed together. The migration and Worker must ship as one controlled release package.

Production cleanup must first be rehearsed against a disposable copy of the current D1 database. No live D1 mutation is authorized by this plan.
