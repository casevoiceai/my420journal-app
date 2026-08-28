# MY420JOURNAL PUBLIC WEBSITE INFORMATION ARCHITECTURE V1

**Version:** 1.0  
**Date:** 27 August 2026  
**Status:** Canonical architecture contract for the next public-site implementation packet  
**Scope:** Public website structure, market-page publication controls, content inheritance, and handoff into the private journal. This document is not a legal approval for any market.

---

## 1. PURPOSE

My420Journal remains one product. The website may present market-specific information, but market pages must not create separate products, separate product identities, or separate private-journal data systems.

The architecture must support three things at the same time:

1. a universal My420Journal public identity;
2. market-specific public information where that use case has been reviewed; and
3. a private local-first journal whose access controls are independent from public marketing pages.

The public website must never imply that the existence of a market page proves that cannabis activity is lawful for a particular user.

---

## 2. NON-NEGOTIABLE ARCHITECTURE RULES

### 2.1 One product, one master identity

- Product name: **My420Journal**.
- No My420Journal USA, My420Journal Europe, My420Journal Germany, or other logo/product forks.
- Regional and local treatments are campaigns/content layers, not product identities.

### 2.2 Public publication status and private-app access status are different controls

The public site must use a separate publication registry. It must not use `src/lib/marketConfig.js` as a marketing permission engine.

`marketConfig.js` remains the private-app access gate. A public page must never grant private-app access, lower an age gate, or override a HOLD/RESERVED/NOT REVIEWED app status.

Conversely, a private-test app configuration does not automatically authorize a public advertising or campaign page.

### 2.3 User-selected market; no IP or GPS routing

- Do not auto-redirect the public site or private journal by IP address.
- Do not request precise GPS merely to select a My420Journal market.
- Market selection is user-controlled and changeable.
- Market selection is not proof of residence, physical location, cannabis legality, license status, or program enrollment.

### 2.4 No mandatory identity account for the private core

The private journal does not require a name, email address, password, exact date of birth, or cloud account.

Public copy must not use account language such as “sign in,” “create account,” or “forgot password” to describe the private local-journal flow.

### 2.5 Same-origin journal for V1

The V1 private journal remains under the same web origin, entered through `/app`.

**Do not move the private journal to `app.my420journal.com` in this architecture version.** Browser local storage is origin-scoped. A host change could strand existing local journal data unless a deliberate migration mechanism is designed and validated first.

A future app subdomain may be reconsidered only with a data-migration, rollback, privacy, and user-communication plan.

### 2.6 No market page may create a purchasing funnel

Public market pages must not add:

- live dispensary menus;
- nearby-dispensary recommendations;
- prices or deals;
- coupons or loyalty tie-ins;
- purchase referrals or affiliate links;
- “best strain/product for X” recommendations;
- medical treatment claims;
- partner access to private journal data.

B2B/partner use cases remain separately gated.

---

## 3. CANONICAL PUBLIC ROUTE TREE

### Global routes

| Route | Purpose | V1 publication status |
|---|---|---|
| `/` | Universal My420Journal product homepage | ACTIVE / EXISTING |
| `/about` | Product/founder story and architecture explanation | ACTIVE / EXISTING |
| `/faq` | Global FAQ | ACTIVE / EXISTING |
| `/contact` | Global contact route | ACTIVE / EXISTING |
| `/privacy` | Canonical privacy notice | ACTIVE / EXISTING |
| `/partners` | Global partner-program status; no active data program | ACTIVE / EXISTING HOLD MESSAGE |
| `/app` | User-selected market + age/access handoff into private journal | ACTIVE / EXISTING |

### United States hierarchy

| Reserved route | Intended purpose | V1 publication status |
|---|---|---|
| `/us` | U.S. master information layer; explains that rules vary by state | REVIEW GATE |
| `/us/pennsylvania` | PA medical-program personal-journal campaign | REVIEW GATE |
| `/us/new-york` | NY 21+ personal-journal campaign | REVIEW GATE |
| `/us/new-jersey` | NJ 21+ personal-journal campaign | REVIEW GATE |
| `/us/massachusetts` | MA 21+ personal-journal campaign | REVIEW GATE |
| `/us/connecticut` | Reserved CT path | HOLD — DO NOT REGISTER OR SERVE |

### Europe / UK reserved hierarchy

| Reserved route | Intended purpose | V1 publication status |
|---|---|---|
| `/nl/amsterdam` | Amsterdam Field Notes campaign | RESERVED / REVIEW REQUIRED — DO NOT REGISTER OR SERVE |
| `/de` | Germany market layer | RESERVED — DO NOT REGISTER OR SERVE |
| `/uk` | United Kingdom market layer | RESERVED — DO NOT REGISTER OR SERVE |

A reserved URI is an architecture reservation only. It is not permission to publish a page.

---

## 4. PUBLICATION STATUS DEFINITIONS

### ACTIVE / EXISTING

Already part of the global public site. Normal product/privacy maintenance applies.

### REVIEW GATE

The route and content model may be prepared internally, but the route must not be made available on a production site until the exact consumer-marketing use case and final copy have cleared the applicable release gate.

A `noindex` tag is **not** a substitute for approval. A publicly accessible preview is still a published web page for operational risk purposes.

Before any REVIEW GATE route is coded, confirm that branch/preview hosting will not automatically expose that page publicly. If preview deployment cannot be prevented, keep the market-page implementation out of deployable branches until the release gate is satisfied.

### HOLD

Do not build a campaign page, placeholder campaign, paid campaign, QR funnel, or partner handoff. Preserve the route reservation only in architecture documentation/registry metadata.

### RESERVED

Future path only. No public page, redirect campaign, or market claim is authorized by the reservation.

---

## 5. CONTENT INHERITANCE MODEL

Market pages must be assembled from inherited layers rather than copied as independent mini-sites.

### Layer A — Global product content

Owned once and reused everywhere:

- My420Journal product identity;
- what the private journal does;
- local-first storage explanation;
- optional network-feature disclosure;
- “record, not recommendation” boundary;
- no medical advice;
- no cannabis sales/purchase connection;
- global About / FAQ / Privacy / Contact links;
- global partner-program status;
- CTA into `/app`.

### Layer B — Regional content

Example: United States.

May add only genuinely regional information, such as:

- cannabis rules vary by state;
- My420Journal does not infer legality from a user’s selection;
- the private journal asks the user to select a supported state when needed;
- adult-use and medical-program contexts are not treated as interchangeable.

The U.S. layer must not say or imply that cannabis is uniformly legal in the United States.

### Layer C — Market delta

A state/local page should contain only the differences needed for that reviewed market:

- market name;
- approved audience/use-case framing;
- market-specific hero/support copy;
- applicable age/program language;
- market-specific disclaimer or warning text if required;
- market-specific CTA preselection value;
- publication status/review metadata.

Do not duplicate the full Privacy Notice or global product story onto every state page.

---

## 6. MARKET PAGE TEMPLATE CONTRACT

A released market page should follow this logical order:

1. **Breadcrumb / market label** — My420Journal → region → market.
2. **Market hero** — personal journaling/recordkeeping first; no purchase funnel.
3. **What My420Journal does** — inherited global product block.
4. **Market-specific use case** — short delta explaining whom the page is designed for and what context applies.
5. **Private by design** — inherited local-first summary with link to the canonical Privacy Notice.
6. **A record, not a recommendation** — inherited boundary block.
7. **Open My420Journal** — CTA into the app market-selection flow.
8. **Market footer note** — only if required by the reviewed market copy.

No state page gets its own privacy policy, product logo, guide system, or separate journal database.

---

## 7. GLOBAL HOMEPAGE CONTRACT

The global homepage must be **universal product first**, not a dispensary or adult-use-market landing page.

The root page should answer:

- What is My420Journal?
- What can I record?
- What stays local?
- What optional features use a network?
- What does the app not do?
- How do I open my private journal?

The global hero must not depend on a visitor being in an adult-use retail market. Dispensary-centric copy such as “Stop guessing at the dispensary” should not be the long-term universal global hero because it does not travel cleanly across medical-only, non-retail, or tightly restricted markets.

Market-specific campaign language belongs below the appropriate reviewed regional/local route, not in the global identity.

---

## 8. PUBLIC PAGE → PRIVATE JOURNAL HANDOFF

### Canonical entry

All public CTAs enter the private journal through `/app`.

### Optional market preselection

A released market page may use a query value such as:

`/app?market=US-PA`

This value is a **suggestion only**.

Required behavior:

1. parse the known market ID;
2. display the suggested market to the user;
3. require explicit user confirmation before saving the market selection;
4. apply the current private-app access status from `marketConfig.js`;
5. require the applicable age confirmation;
6. never bypass a HOLD/RESERVED/NOT REVIEWED state;
7. ignore malformed or unknown market IDs and show the normal selector.

The URL parameter must never itself be treated as age assurance, residence proof, physical-location proof, or app-access permission.

---

## 9. MARKET-SELECTOR LANGUAGE CONTRACT

The current implementation uses “Where do you live?” / “What state do you live in?” and stores the choice through residence-named code. That is too rigid for a user-controlled market system and can create the wrong implication when a user travels.

Target user-facing language for the next implementation packet:

**Country step:** “Where are you using My420Journal?”  
Support: “Choose the market My420Journal should use on this device. We do not need your street address or GPS location.”

**U.S. step:** “Which state should My420Journal use?”  
Support: “Choose the state for this journal session. This selection does not prove that any cannabis activity is legal.”

The user must be able to change the selected market later.

Internal `residence` naming may remain temporarily for backward compatibility, but it must not be treated as canonical product semantics. A future technical cleanup may rename the module/storage terminology only after migration tests protect existing local data.

---

## 10. PRIVATE-JOURNAL ROUTE SEMANTICS

Current runtime routes `/signup`, `/login`, and `/forgot-password` are legacy names. The current screens create or resume an anonymous local journal and do not use email/password cloud accounts.

V1 public UI must not expose those legacy names as account concepts.

Target aliases for a later routing-cleanup packet:

- `/app/start` → create/start a local journal;
- `/app/open` → resume/open the local journal on this device.

Legacy `/signup` and `/login` may redirect to the new aliases during migration so old bookmarks do not break.

`/forgot-password` has no product meaning in the no-password architecture and should ultimately be retired rather than repurposed as an account-recovery promise.

This route cleanup is **not** part of the first market-page implementation unless explicitly included in that packet.

---

## 11. PUBLIC MARKET REGISTRY CONTRACT

Create a public-site registry separate from private `marketConfig.js` when market pages are implemented.

Recommended responsibilities:

- route slug;
- parent region;
- market ID used only for optional CTA preselection;
- public publication status;
- title/hero/content-delta keys;
- required review reference/version;
- indexability status;
- release date/version once approved.

The registry must not contain logic that grants private-journal access.

Recommended public statuses:

- `active`
- `review_gate`
- `hold`
- `reserved`

Router registration should include only `active` pages in production. `review_gate`, `hold`, and `reserved` records must fail closed.

---

## 12. SEO / INDEXING / REDIRECT RULES

- Only released `active` market pages may be indexed.
- `review_gate`, `hold`, and `reserved` market pages must not be publicly served; `noindex` alone is insufficient.
- No IP-based canonicalization or forced country/state redirect.
- A visitor must always be able to return to the global homepage.
- Market pages use self-canonical URLs only after release.
- Do not generate hundreds of thin state/location pages merely for search traffic.

---

## 13. ANALYTICS AND ATTRIBUTION BOUNDARY

The public-site architecture must not create a bridge from public marketing analytics into private journal contents.

If public analytics, referral measurement, QR attribution, or partner attribution is proposed later:

- it requires a separate privacy/use-case review;
- it must not inspect private journal entries or notes;
- it must not use a private journal profile ID as an advertising/marketing identifier;
- it must not silently convert the user-selected private market into ad-targeting data;
- it must not be added merely because public and private routes share one origin.

Until such a review is complete, the architecture assumes no new advertising trackers or partner attribution system.

---

## 14. PARTNER / B2B BOUNDARY

`/partners` remains a global hold/status page.

Market pages must not add dispensary co-branding, counter QR programs, affiliate relationships, partner dashboards, partner data access, or partner-specific calls to action merely because the consumer page exists.

Each B2B arrangement is a separate approved use case with separate marketing, data, and partner review.

---

## 15. V1 MARKET STATUS MAP

This table controls architecture work only. It is not a legal opinion.

| Market | Public page | Public status | Private-app status in current build | Architectural instruction |
|---|---|---|---|---|
| Global | `/` | ACTIVE / EXISTING | n/a | Universal product-first site |
| USA master | `/us` | REVIEW GATE | state-dependent | Prepare only after release-gate workflow is defined |
| Pennsylvania | `/us/pennsylvania` | REVIEW GATE | `private_test` | Medical-program personal-journal treatment; no dispensary handout/partner assumption |
| New York | `/us/new-york` | REVIEW GATE | `private_test` | 21+ personal-journal treatment; no purchase/medical claim |
| New Jersey | `/us/new-jersey` | REVIEW GATE | `private_test` | 21+ personal-journal treatment; no location-trigger/purchase funnel |
| Massachusetts | `/us/massachusetts` | REVIEW GATE | `private_test` | 21+ personal-journal treatment; no therapeutic claim |
| Connecticut | `/us/connecticut` | HOLD | `hold` | Reserve path only; no page registration |
| Amsterdam | `/nl/amsterdam` | RESERVED / REVIEW REQUIRED | Netherlands `reserved` | Preserve Amsterdam Field Notes concept; do not publish yet |
| Germany | `/de` | RESERVED | `reserved` | No campaign implementation |
| United Kingdom | `/uk` | RESERVED | `reserved` | No campaign implementation |

---

## 16. IMPLEMENTATION ORDER

After this contract is merged, implementation should proceed in this order:

1. **Universal global-home correction** — make `/` product-first rather than dispensary-first while preserving current design unless a separate design packet is authorized.
2. **Public market registry + tests** — create the separate fail-closed publication registry without registering gated pages in production.
3. **Market-selector semantics** — replace residence-facing language with user-selected-market language and add safe query preselection/confirmation behavior.
4. **U.S. shared page component/content inheritance** — build reusable structure without publishing gated market routes.
5. **State content packets** — PA, NY, NJ, MA one at a time, each with exact review gate before route activation.
6. **Connecticut remains HOLD.**
7. **Amsterdam / Germany / UK remain RESERVED** until their separate release gates are completed.

---

## 17. RELEASE GATE FOR ANY NEW MARKET PAGE

Before changing a market route from `review_gate`/`reserved`/`hold` to `active`, verify all of the following:

- exact consumer use case is defined;
- final copy is reviewed against current market rules;
- required warnings/age controls are known;
- no prohibited purchase/referral/medical claims are present;
- private-app access status is independently correct;
- CTA does not bypass market/age controls;
- partner/B2B assumptions are absent unless separately approved;
- preview/production hosting behavior is understood;
- privacy/data-flow impact is reviewed;
- route and claim regression tests pass;
- production build passes;
- release decision is recorded with date/version/source.

Unknown, stale, or unreviewed status fails closed.

---

## 18. V1 DECISIONS LOCKED BY THIS DOCUMENT

- One My420Journal product globally.
- Global homepage remains the root and becomes universal product-first.
- User chooses the market; no IP/GPS forced routing.
- No mandatory name/email/password account for the private core.
- Same-origin `/app` remains the private-journal entry point in V1.
- Public publication controls are separate from private app-access controls.
- Market content inherits global → regional → local deltas.
- PA/NY/NJ/MA are review-gated public routes, not automatically approved pages.
- CT is HOLD and must not be served as a campaign page.
- Amsterdam, Germany, and UK paths are reserved only.
- Public market CTA may suggest a market but cannot save it or bypass age/access controls without user confirmation.
- Legacy account-route names are not canonical product language.
- No public analytics/partner attribution is authorized by this architecture.
- No market page is a purchase, referral, or medical-recommendation funnel.

---

**End of MY420JOURNAL PUBLIC WEBSITE INFORMATION ARCHITECTURE V1**
