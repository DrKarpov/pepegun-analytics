# Pepegun Analytics — technical roadmap

Updated 2026-11-26. Baseline: v29, commit 6eedcb502bddc08581e9a0d269e55ce1b3721a08; latest main at documentation preparation: 07e46d4414a2ee735eee75b72ff6efe152a35fd2 (snapshot-only updates may follow).

Goal: strengthen reliability and maintainability without redesigning the approved dashboard or introducing paid infrastructure. This roadmap preserves the 15 tasks from the v28 audit. Documentation handoff is not implementation progress.

## Status and resume pointer

- Cosmetic phase v29: complete in main. P1 merged and observed deployed by user. Compact-status correction and P2-01 merged after successful browser and Node CI; post-merge snapshot and publication verification remain pending. P2-02 candidate is in PR #3.
- Progress: 0 / 15.
- Next: verify [PR #3](https://github.com/drkarpov/pepegun-analytics/pull/3), work/p2-02-cancellation at fcc96dba524e07e1d3dbf1d2519622d40bad1d7e (fetch actual head). Check actual Node/browser CI, review and merge only after passing; confirm P1/P2-01 publication and full live snapshot audit. User requires no extra sync/audit warning panel or shifting cards. Then P2-03.
- State vocabulary: TODO, IN PROGRESS, BLOCKED, VERIFIED (branch), DONE (main + verification). A code change without required tests is not DONE.

## Stage 1 — P1: data reliability (0/4)

| ID | Task | Acceptance criteria | Dependencies | Status |
|---|---|---|---|---|
| P1-01 | Compare complete ordered transaction identities | Earlier unclassified hash alteration no longer matches; common-tip comparison, no duplicates; valid historical snapshot and cache migration tested. | Coordinate P1-03 | VERIFIED (branch) |
| P1-02 | Surface indexer mismatches | Main indicator and relevant exports clearly distinguish suspect data, prior-tip check and unavailable source; no green verified claim during known mismatch; preserve last known data; test precedence and concurrent refresh. | None; coordinate P1-01 | VERIFIED (branch) |
| P1-03 | Strengthen history continuity | Validate LT and available previous hashes, verify incremental anchor; reject missing/gapped/inconsistent chains safely; test both API shapes and legacy cache/snapshot compatibility. | Coordinate P1-01 | VERIFIED (branch) |
| P1-04 | Add integrity regression tests | Reproduce all P1 findings and demonstrate fixes; exercise corrupt input, common-tip, incremental/full/fallback cases; existing analytics/insights/snapshot tests remain passing. | P1-01/02/03 (tests developed alongside changes) | VERIFIED (branch) |

Stage gate: evidence-backed source contracts, migration and failure handling, metric reconciliation against a fixed snapshot, reviewed diff, successful CI and documented residual limitations. Do not publish a new schema that breaks existing deployed clients.

## Stage 2 — P2: performance, resilience, UX, security (0/7)

| ID | Task | Acceptance criteria | Dependencies | Status |
|---|---|---|---|---|
| P2-01 | Separate code CI and snapshot workflow | UI-only code changes do not trigger history download; regression tests run on relevant changes; snapshot schedule/manual generation validates and publishes without losing concurrent commits. | Stage 1 gate | VERIFIED (branch) |
| P2-02 | Add overall deadline and audit cancel | Abort propagates through network, retry and pagination; no stale busy state, no lost cache, clear cancelled/unavailable status; tests for offline, timeout and cancellation. | P1 | IN PROGRESS |
| P2-03 | Optimize repeated indexer checks | Incremental verification from an agreed checkpoint, full fallback and manual full audit; no weakened integrity, respect API limits. | P1-01/03, P2-02 | TODO |
| P2-04 | Prevent accidental chart selection while scrolling | Vertical swipe does not select a point; intentional tap/drag, mouse and keyboard still work; long press export unaffected. | Stage 1 gate | TODO |
| P2-05 | Improve returning-wallet graph contrast | At least 3:1 on relevant adjacent background, same restrained palette; consistency on live chart and both exports. | Stage 1 gate | TODO |
| P2-06 | Clarify PNG time and activity scopes | All six cards RU/EN: accurate range/anchor; UTC once beside actual time where necessary, never beside date-only label; no timestamp/footer restoration; preview equals PNG. | Stage 1 gate | TODO |
| P2-07 | Add CSP | Restrict resource/network origins, maintain required API and snapshot fallback, canvas/SVG/blob exports, inline dynamic style compatibility; verify in browser. | Stage 1 gate | TODO |

Stage gate: source integrity retained, no paid infrastructure, no visual redesign, tested failure paths and key interactions; actual browser checks or explicit blocker.

## Stage 3 — P3: maintainability (0/4)

| ID | Task | Acceptance criteria | Dependencies | Status |
|---|---|---|---|---|
| P3-01 | Consolidate CSS | Remove redundant overrides in small batches; compare baseline desktop/mobile RU/EN and modal/hold states; no layout regressions. | P3-04 baseline tests recommended first | TODO |
| P3-02 | Modularize app.mjs | Separate coherent concerns with clear dependencies, retain all features and exact calculations, safe cache-busting/versioned imports. | P3-04 baseline tests recommended first | TODO |
| P3-03 | Maintain README and context | Accurate setup, architecture, methodology, operational commands, current statuses and limitations. Update throughout, finalize after changes. | All relevant changes | TODO |
| P3-04 | Add automated browser tests | Repeatable Chromium and available WebKit checks for core flows, both languages, narrow/desktop screens, preview and download, gesture/failure states; document native iOS limits. | Start baseline coverage before visual/refactor changes | TODO |

Test infrastructure can be introduced earlier to protect P1/P2. Stage numbering is priority, not a prohibition on prerequisite tests. Do not do unrelated cleanup in an integrity change.

## Work log

| Date | Task | Branch / commit | Checks | Result / next |
|---|---|---|---|---|
| 2026-11-26 | Documentation handoff | main (see git history) | Audit evidence and task list transcribed | 15 TODO; begin P1 |

| 2026-11-26 | P1-01/03 and initial P1-04 fixtures | [c9fee7c](https://github.com/drkarpov/pepegun-analytics/commit/c9fee7c0e5bfe5c11f77705009f3decbfaf5ddbb), [8c0c36d](https://github.com/drkarpov/pepegun-analytics/commit/8c0c36dd1d099b914947e2d8ee6da145b832523d), [da47494](https://github.com/drkarpov/pepegun-analytics/commit/da474944f4693c63eebee2d832c551fbdbd6a88d), [d353c4d](https://github.com/drkarpov/pepegun-analytics/commit/d353c4d9525ba0d0546cdfabd1c3d8ca19c8061c), [28314d9](https://github.com/drkarpov/pepegun-analytics/commit/28314d9fe47e0b78449da41f4b2c810705bb6476) | Isolated V8: original defect reproduced; analytics 25, insights 70, fixed snapshot 4626, integrity 23 (network fixtures with URL/abort/timer shims). Not actual Node or CI. | Full LT/hash cache history, optional previous-hash linkage, safe incremental anchor/full rebuild, same-tip complete seed preference, published history prefix check. Changed analytics.mjs, insights.mjs, snapshot.mjs, integrity.test.mjs. No public schema change. Need live API verification, actual Node/CI, cache-busting, review of generator and failure paths; P1-02 remains TODO. Existing push workflow checks out main, not task branch; do not mistake it for branch CI. |

| 2026-11-26 | P1 candidate continuation | [PR #1](https://github.com/drkarpov/pepegun-analytics/pull/1), [fa269be](https://github.com/drkarpov/pepegun-analytics/commit/fa269be25f7d1ca5137ca7f75ceb695cb05c73ca) | [Node + live providers passed](https://github.com/drkarpov/pepegun-analytics/actions/runs/45884157669); subsequent [CI](https://github.com/drkarpov/pepegun-analytics/actions/runs/45884287167) passed Node/live provider steps but Playwright installation failed on Ubuntu 26.04; pinned runner to 24.04; [recheck](https://github.com/drkarpov/pepegun-analytics/actions/runs/45884309837) started. | Candidate adds versioned full-history trust, sticky warnings on mismatch, seed/cache prefix reconciliation, concurrent audit/refresh handling, CSV and PNG warnings, cache-busting, fallback/negative fixtures and browser tests for both languages and six viewport widths. Await actual browser evidence; preserve main's newer snapshot; do not merge prematurely. |

| 2026-11-26 | P1 verification and integration | [b7c5a3c](https://github.com/drkarpov/pepegun-analytics/commit/b7c5a3c095a6fb021ed5ebd7bf7307bb2504d2c8) | [CI 45884309837](https://github.com/drkarpov/pepegun-analytics/actions/runs/45884309837) successful: Node regressions, syntax, 3737 fixed snapshot rows, both live provider schemas + 3 shared transactions, Chromium and WebKit RU/EN at 6 widths, CSV/PNG, screenshot artifact. Main changes since tested merge only handoff documentation; merge preserved latest snapshot. | PR merged; verify post-merge workflows and Pages; actual iOS/native share not tested; screenshot artifact generated but not manually inspected. |

| 2026-11-26 | User status correction + P2-01 candidate | [PR #2](https://github.com/drkarpov/pepegun-analytics/pull/2), [bc8eac4](https://github.com/drkarpov/pepegun-analytics/commit/bc8eac497d69780d5d0f977579698ffbdff8adfb) | Browser test added for legacy and unavailable audit with no panel and stable card position; CI pending. | User screenshots confirm deployed P1 but reject redundant warning block during refresh. Remove duplicate sync/audit notice, distinguish legacy audit pending vs actual unavailable, update cache versions. Snapshot workflow on main/data changes only; code CI independent; safe retry from latest main on conflict. Current public seed actually has unavailable audit; added diagnostic logging. No claim of successful full live history audit yet. |

| 2026-11-26 | Compact status + P2-01 merged | [9a3cf2e](https://github.com/drkarpov/pepegun-analytics/commit/9a3cf2e32a15621b17ec431e4c8912f885e979b9) | [CI 45885172656](https://github.com/drkarpov/pepegun-analytics/actions/runs/45885172656) successful: Node, provider samples, Chromium/WebKit, migration/no-panel/card-position regression. | Merge preserved public snapshot; current snapshot still reports unavailable audit; post-merge workflow and Pages not yet verified. |
| 2026-11-26 | P2-02 candidate | [PR #3](https://github.com/drkarpov/pepegun-analytics/pull/3), [fcc96db](https://github.com/drkarpov/pepegun-analytics/commit/fcc96dba524e07e1d3dbf1d2519622d40bad1d7e) | Added Node abort/deadline/retry/pagination fixtures and browser cancellation regression; actual CI pending. | 240-second overall audit deadline, abortable network/retry/pagination; reuse existing audit button for cancellation, preserve prior cache and audit, timeout distinct from cancellation, no new panel. Await CI and earlier stage gates. |

After each work unit add an entry with exact commit, changed files or linked diff, tests actually executed and their results, blockers, and next action. Update status and resume pointer in the same commit where practical. If a task is only proposed, leave it TODO. Keep previous entries. See DEVELOPMENT_RULES.md.
