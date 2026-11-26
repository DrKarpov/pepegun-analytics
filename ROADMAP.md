# Pepegun Analytics — technical roadmap

Updated 2026-11-26. Baseline: v29, commit 6eedcb502bddc08581e9a0d269e55ce1b3721a08; latest main at documentation preparation: 07e46d4414a2ee735eee75b72ff6efe152a35fd2 (snapshot-only updates may follow).

Goal: strengthen reliability and maintainability without redesigning the approved dashboard or introducing paid infrastructure. This roadmap preserves the 15 tasks from the v28 audit. Documentation handoff is not implementation progress.

## Status and resume pointer

- Cosmetic phase v29: complete in main. No technical roadmap task has been started or completed.
- Progress: 0 / 15.
- Next: P1-01 and P1-03, jointly design full-history identity, hash linkage and cache migration. Read actual current source and verify provider contracts before editing. P1-02 can be implemented independently; P1-04 covers the whole P1 batch.
- State vocabulary: TODO, IN PROGRESS, BLOCKED, VERIFIED (branch), DONE (main + verification). A code change without required tests is not DONE.

## Stage 1 — P1: data reliability (0/4)

| ID | Task | Acceptance criteria | Dependencies | Status |
|---|---|---|---|---|
| P1-01 | Compare complete ordered transaction identities | Earlier unclassified hash alteration no longer matches; common-tip comparison, no duplicates; valid historical snapshot and cache migration tested. | Coordinate P1-03 | TODO |
| P1-02 | Surface indexer mismatches | Main indicator and relevant exports clearly distinguish suspect data, prior-tip check and unavailable source; no green verified claim during known mismatch; preserve last known data; test precedence and concurrent refresh. | None; coordinate P1-01 | TODO |
| P1-03 | Strengthen history continuity | Validate LT and available previous hashes, verify incremental anchor; reject missing/gapped/inconsistent chains safely; test both API shapes and legacy cache/snapshot compatibility. | Coordinate P1-01 | TODO |
| P1-04 | Add integrity regression tests | Reproduce all P1 findings and demonstrate fixes; exercise corrupt input, common-tip, incremental/full/fallback cases; existing analytics/insights/snapshot tests remain passing. | P1-01/02/03 (tests developed alongside changes) | TODO |

Stage gate: evidence-backed source contracts, migration and failure handling, metric reconciliation against a fixed snapshot, reviewed diff, successful CI and documented residual limitations. Do not publish a new schema that breaks existing deployed clients.

## Stage 2 — P2: performance, resilience, UX, security (0/7)

| ID | Task | Acceptance criteria | Dependencies | Status |
|---|---|---|---|---|
| P2-01 | Separate code CI and snapshot workflow | UI-only code changes do not trigger history download; regression tests run on relevant changes; snapshot schedule/manual generation validates and publishes without losing concurrent commits. | Stage 1 gate | TODO |
| P2-02 | Add overall deadline and audit cancel | Abort propagates through network, retry and pagination; no stale busy state, no lost cache, clear cancelled/unavailable status; tests for offline, timeout and cancellation. | P1 | TODO |
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

After each work unit add an entry with exact commit, changed files or linked diff, tests actually executed and their results, blockers, and next action. Update status and resume pointer in the same commit where practical. If a task is only proposed, leave it TODO. Keep previous entries. See DEVELOPMENT_RULES.md.
