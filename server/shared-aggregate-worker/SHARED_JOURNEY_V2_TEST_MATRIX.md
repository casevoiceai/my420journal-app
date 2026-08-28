# Shared Journey V2 test matrix

Status: required acceptance matrix. No production authorization.

## Feature gate

1. Client missing flag -> Shared Journey UI unavailable.
2. Proxy missing flag -> non-cleanup Shared Journey route returns disabled response.
3. Proxy blank flag -> OFF.
4. Proxy malformed flag -> OFF.
5. Proxy false flag -> OFF.
6. Proxy true flag while route unfinished -> route still does not reopen.
7. Worker missing/blank/malformed/false flag -> non-cleanup routes fail closed.
8. Opt-out cleanup remains reachable while feature is OFF where server cleanup is possible.

## No persistent contributor profile

9. Opt-in flow does not create a permanent active contributor/member row.
10. A staged contributor token/hash disappears after staging expiry.
11. Permanent aggregate tables contain no contributor identifier or foreign key.
12. Permanent eligibility tables contain no contributor list.
13. Suppression/tombstone state cannot be joined to product, region, effect or contribution history.

## Staging expiry

14. Row with `expires_at` in the past is removed or ignored immediately.
15. Scheduled cleanup removes expired rows.
16. Delayed scheduled cleanup cannot make expired rows eligible for reads/aggregation.
17. Staging rows never survive beyond the reviewed retention maximum in disposable-copy time-travel tests.

## Aggregation

18. Product pool below 10 is not eligible.
19. Product pool at 10 can become eligible only under the approved confirmation policy.
20. Product+region pool below 25 is not eligible.
21. Product+region pool at 25 can become eligible only under the approved confirmation policy.
22. Permanent aggregate update does not create permanent per-contribution rows.
23. Failed aggregate write does not delete staging prematurely.
24. Successful fold does not leave a permanent contributor mapping.

## Read privacy

25. Sub-threshold GET does not return exact sample size.
26. Sub-threshold GET does not return approximate sample size or internal threshold progress.
27. Eligible GET exposes only approved aggregate output.
28. Read API cannot enumerate staging, suppression or internal migration rows.
29. Product/region requests cannot be combined to trivially reveal a small subgroup through subtraction.
30. Nearby/coarser-region differencing cases are explicitly tested.

## Opt-out

31. Opt-out while online receives a real backend success before UI claims server cleanup success.
32. Backend failure produces a visible failure/pending state, not false success.
33. Offline opt-out clearly distinguishes local preference change from server deletion.
34. Suppression state stores only the minimum approved tombstone data.
35. Re-opt-in behavior cannot silently turn a suppression tombstone into a contributor profile.

## Abuse controls

36. Raw source IP is never stored.
37. Equivalent normalized IPv6 representations map consistently where source throttling is used.
38. Required salt missing/blank -> fail closed.
39. Rate-event TTL is bounded and tested.
40. Rate events do not contain product/region/contribution history unless separately approved.

## Migration rehearsal

41. Disposable copy of production D1 can be migrated without touching production.
42. Existing persistent active contributor rows are removed or transformed only according to the approved cleanup plan.
43. Existing opt-out suppression rows are reviewed and transformed into the minimal V2 tombstone shape if still needed.
44. Migration audit records counts/version facts without copying user-level rows permanently.
45. Quarantine has a bounded retention/deletion deadline.
46. Current old Worker queries cannot run against the V2 schema in the release package.
47. New V2 Worker and target schema pass compatibility tests together.

## Rollback/change control

48. Pre-change production Worker version and D1 backup/copy evidence are captured.
49. Release commit, migration version and deployed Worker version are recorded together.
50. Rollback instructions are tested without requiring reconstruction from memory.

## Re-enable gate

Shared Journey may not be considered for re-enable until all required automated tests pass, disposable-copy migration evidence is reviewed, privacy/control documentation matches the implementation, founder acceptance is recorded, and any required legal review is complete.
