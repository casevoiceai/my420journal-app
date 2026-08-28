# Shared Journey V2 Contract

Status: remediation design authority. Not production-ready. Shared Journey remains OFF.

## Non-negotiable privacy boundary

V2 must not maintain a permanent active contributor profile, membership row, or reusable pseudonymous user record.

A contribution may contain a short-lived random submission/contributor token only for the minimum time needed to stage, deduplicate where approved, enforce abuse controls, and aggregate. That identifier must not survive the staging retention boundary.

The only persistent user-linked state that may remain is a narrowly scoped opt-out/suppression tombstone when required to honor a deletion or suppression request. A tombstone must contain the minimum information necessary for that purpose and must not become a general contributor profile.

## Staging

- Staging retention maximum: approximately 72 hours.
- Expiry must be enforced by code and verified by tests. A comment or intended cron schedule is not evidence of expiry.
- Staging must not retain raw private journal notes, health narrative, exact location, exact timeline, or other Layer 1 content.
- Production remediation must prove expiry against a disposable copy before any live cleanup or re-enable.

## Permanent storage

Permanent Layer 2 storage is aggregate-only, plus narrowly approved suppression/tombstone state.

Permanent aggregate records must not contain contributor IDs, contribution IDs that can be mapped back to a person, raw IP addresses, device identifiers, exact event timestamps, or raw journal text.

## Thresholds

- Product pool minimum: 10.
- Product + region pool minimum: 25.
- Threshold eligibility must fail closed.
- Region/product combinations must be designed against differencing attacks. A caller must not be able to infer a small subgroup by subtracting nearby aggregate responses.
- Before a pool is eligible, API responses must not disclose exact or approximate contributor counts.

## Reads

Aggregate GET/read paths must expose only approved aggregate output for permanently eligible pools.

Do not return raw rows, staging state, contributor state, exact sample size below threshold, or internal eligibility details that materially aid re-identification.

## Opt-in and opt-out

Opt-in must not create a permanent active contributor profile.

Opt-out cleanup must remain available while Shared Journey is globally disabled where technically possible. The client must accurately report backend success/failure and must not show a false-success state.

If offline operation prevents a cloud deletion request, the UI must say that the request has not yet reached the service. Local opt-out state alone is not proof of server deletion.

## Feature gate

Shared Journey requires defense in depth at client, Pages proxy, and Worker.

`SHARED_JOURNEY_ENABLED` rules:

- missing = OFF
- blank = OFF
- malformed = OFF
- false = OFF
- only explicit `true` may pass the configuration gate

Passing the configuration gate alone must never be sufficient to re-enable an unfinished V2 route.

## Release boundary

Worker code and D1 schema must be reviewed, tested, migrated, and deployed as one controlled release. Do not repeat the current production split where the Worker and database represent different architectures.

Required before any re-enable decision:

1. Disposable-copy migration test.
2. Verified removal of permanent active contributor profiles.
3. Verified staging expiry.
4. Threshold and differencing tests.
5. Opt-out deletion/suppression tests.
6. Missing/blank/false feature-flag tests at every layer.
7. Worker/schema compatibility test.
8. Rollback plan and captured pre-change production evidence.
9. Founder acceptance.
10. Required privacy/legal review.

No production D1 mutation, Worker deployment, traffic change, or Shared Journey re-enable is authorized by this document.
