# Shared Journey V2 implementation notes

This branch is intentionally non-production and incomplete.

Current branch slice:

- adds explicit fail-closed `SHARED_JOURNEY_ENABLED` handling at the Pages proxy
- keeps opt-out cleanup reachable while Shared Journey is disabled
- prevents configuration alone from reopening unfinished V2 routes
- defines the controlling V2 privacy/runtime contract

Not yet implemented on this branch:

- Worker-level `SHARED_JOURNEY_ENABLED` gate
- replacement D1 schema without permanent active contributor profiles
- short-lived staging expiry implementation/tests
- aggregate-only write path
- threshold/differencing protections
- V2 read API
- client opt-in UI and accurate backend-success handling
- disposable-production-copy migration tests
- rollback package

Do not merge or deploy this branch until those items are implemented, reviewed, tested, and founder-approved.
