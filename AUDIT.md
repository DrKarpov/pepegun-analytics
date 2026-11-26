# Pepegun Analytics — audit record

Date: 2026-11-26. Audited source and data revision: [e70c5d9](https://github.com/drkarpov/pepegun-analytics/tree/e70c5d95ac23b599e6b11e9ccdb85004bba86ecb) (v28). Final cosmetic baseline: [v29 / 6eedcb5](https://github.com/drkarpov/pepegun-analytics/commit/6eedcb502bddc08581e9a0d269e55ce1b3721a08). Snapshot-only commits can advance main independently. This is a durable review record, not a claim that any listed repair has been made.

## Verdict and evidence

Ready for public use with caveats; technical revision required. No central calculation error was demonstrated on the audited snapshot. Source integrity and failure-state handling have material gaps. Complete browser and independent live-source verification were not performed.

- [Successful snapshot workflow](https://github.com/DrKarpov/pepegun-analytics/actions/runs/45881445978); [successful Pages deployment](https://github.com/DrKarpov/pepegun-analytics/actions/runs/45881642577).
- Snapshot as of 2026-11-26 19:09:20 UTC; last transaction 18:50:56 UTC; tip LT 119262213000008; Toncenter primary; recorded TonAPI match at that tip.
- 3,737 scanned, 3,445 classified, 0 ambiguous, 85 distinct addresses, 58 paying addresses, 1,077 fee transfers, 2,368 other labelled transfers, 64.785464888 GRAM gross labelled fees. These are historical observations, not current expected constants.
- Activity 1/7/30 calendar days: 13/43/78. Return rates: 35/49, 18/27, 7/12 eligible addresses respectively.
- Existing test scenarios executed in an isolated JavaScript environment with equivalent assertions: analytics 25, insights 70, snapshot 4,626; total 4,721 passing assertions. This was not a local Node invocation; the actual repository workflow also reported success. Snapshot tests recompute from the curated published rows, not independent raw blockchain evidence.
- Export renderer: six cards × two languages, simulated canvas with approximate text widths; no vertical text overflow detected in those fixtures. Not actual pixel rendering or native sharing verification.
- Static inspection: 147 translation keys per language, no missing referenced static/dynamic IDs or duplicate HTML IDs. Syntax checked. No third-party runtime JS libraries or embedded API keys found in inspected files.

## P1 — data integrity

| ID | Observation and evidence | Required outcome |
|---|---|---|
| P1-01 | analytics.mjs compareSnapshots/crossCheck compare classified rows, totals and tip, not every unclassified transaction hash. Synthetic change to an earlier unclassified hash still produced a match. | Compare full ordered transaction identity at a common tip, including unclassified rows; retain sufficient identity in cache/snapshot. |
| P1-02 | app.mjs updateStatus ignores audit mismatch; only collapsed methodology reports it. selectSnapshot can prefer a newer local mismatch over a same-tip matching seed. | Visible data-trust warning, deterministic audit/seed/cache precedence, preserve last valid data without implying a verified match. Distinguish mismatch from unavailable and prior-tip audit. |
| P1-03 | analytics.mjs verify checks previous logical time but not previous transaction hash. Incremental anchor verification is conditional on anchor being present. | Verify previous hashes wherever supported; establish trustworthy incremental anchor, fail safely on inconsistency. Verify actual API schemas/semantics before implementation. |
| P1-04 | Existing tests do not cover the demonstrated cases or sufficient sync failure paths. | Add regression fixtures for P1 changes and verify all existing metric invariants. |

The hash-mutation case is synthetic: it demonstrates the comparator's blind spot, not evidence of historical corruption or a valid alternative blockchain chain. Stronger checks should be coordinated so new identity fields and old caches are migrated safely.

### Methodology limits (not a proven data error)

Any sender can imitate an accepted comment such as Pepegun fee. A synthetic labelled transfer was classified as a fee. Two indexers agreeing on a transfer does not establish its business attribution. Preserve the stated definitions: addresses, not people; gross incoming labelled fees, not profit or trades; venue labels, not verified execution venues. No manipulation was demonstrated; independent attribution was not established. Do not silently change eligibility rules or add exclusions without evidence and approval.

## P2 — stability, UX and security

| ID | Observation | Proposed direction |
|---|---|---|
| P2-01 | snapshot.yml triggers full history refresh on any docs/*.mjs change, including export-only changes. | Separate code CI and snapshot refresh. Preserve schedule, validation and safe publishing. |
| P2-02 | Per-request timeout/retry exists; no end-to-end deadline or user cancellation for audit. | Bounded total deadline, abort propagation and visible cancel state. Never misreport aborted audit as match. |
| P2-03 | Alternate-source audit downloads entire history. At 3,737 rows TonAPI needs about 38 pages and 55.5 seconds of configured inter-page waits before network/retries. | Incremental verification from a previously verified checkpoint, with explicit full-audit fallback. Only after P1 integrity is established. |
| P2-04 | Chart pointerdown immediately changes selection even during a vertical scroll beginning on the plot. | Distinguish scrolling from deliberate tap/horizontal selection; retain keyboard and mouse behavior. |
| P2-05 | Returning-wallet series #414f48 vs #171a18 gives about 2.04:1 contrast, below the 3:1 graphical-object target. | Slightly lighten existing gray-green; apply consistently to live chart and both PNG paths. |
| P2-06 | Active-wallet card uses calendar 1/7/30-day windows anchored at range end, even if selected range is 6h. PNG heading may imply all values belong to selected range. Date-only range with hourly chart readout can omit UTC. | Clarify active-card scope and ensure one UTC marker adjacent to an actual time when needed. Keep compact design, no creation timestamp. |
| P2-07 | No Content Security Policy in HTML. Escaping and safe external-link attributes already present. | Add restrictive compatible CSP (including required API, raw snapshot, SVG/blob/canvas paths); test actual browser enforcement. |

Snapshot is about 803 KB uncompressed; monitor growth. No paid backend/database is justified at present. Local IndexedDB caches and language preference are intentional; no new tracking or user identification.

## P3 — maintainability and test coverage

| ID | Observation | Proposed direction |
|---|---|---|
| P3-01 | styles.css has accumulated sequential overrides, ~32 KB and 19 media rules in audited version. | Consolidate final computed styles incrementally, preserving behavior and screenshots. |
| P3-02 | app.mjs (~52 KB) combines translations, state, rendering, charts, tables, exports and sync. | Extract focused modules in small behavior-preserving changes; keep explicit cache versioning. |
| P3-03 | README and historical context require a maintained current-state handoff. | Update architecture, commands, data methodology, limitations and operational guidance as implementation changes. |
| P3-04 | No committed automated browser/visual regression tests. | Add automated desktop/mobile viewport, RU/EN, error and export interaction checks. Test WebKit where available; real iOS Safari and native share remain separate acceptance checks. |

## Unverified / coverage boundaries

- Independent live fetch from both indexers and exact API schema behavior were not verified in this audit; recorded workflow match is not a fresh independent audit.
- Real current full-site browser rendering, actual exported PNG pixels, iOS date controls, focus, long-press, clipboard, native share and download were not verified.
- Existing tests pass but do not prove complete correctness. Simulations and source inspection must never be described as real browser tests.
- The latest v29 footer is intentionally shorter. Detailed methodology/README still preserve wallet-vs-user and independence distinctions.
- No application files were modified during the review. All roadmap tasks remain open at handoff.

See ROADMAP.md for execution status and DEVELOPMENT_RULES.md for publication and verification rules.
