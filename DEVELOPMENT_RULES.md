# Pepegun Analytics — development and handoff rules

## Source of truth

The GitHub repository, current branch head, actual source files, PROJECT_CONTEXT.md, AUDIT.md and ROADMAP.md are the durable context. Historical chat is supplementary. Never assume an old commit is still main; automatic snapshot updates may run during development. Read the latest versions at the beginning of every session.

## Non-negotiable constraints

- Preserve the approved v29 interface, logo, color palette, layouts, RU/EN functionality, mobile/desktop support, footer links, and the agreed export interactions. Do not redesign or reintroduce rejected UI.
- No unrelated feature removal, cosmetic expansion, tracking, paid API, server, or database without explicit approval. Keep static GitHub Pages and free public sources.
- Preserve metric definitions, integer/nano-unit precision, UTC calculation semantics, existing ranges, historical rows, and exact CSV totals. Any methodological change requires evidence and separate approval. Addresses are not people; labelled fees are not trades or net profit.
- Keep both global and individual exports. Individual export scope: overview, active, new/returning, growth, activity, fees. No venues or detailed statistics export. Original SVG logo, compact centered PNG, no URL footer or as-of timestamp. Only file in native share. Passive canvas preview without visible title, cross or persistent hint; close via outside tap/Escape. Existing 240 ms feedback / 600 ms hold / 8 px movement cancellation and reduced-motion behavior retained unless an explicitly scoped bug fix requires change.
- Do not confuse the historical v12 visual baseline for top filter tabs with the current v29 overall baseline. Earlier v13 was rejected. Latest accepted requirements supersede older version notes.

## Git workflow and concurrent snapshots

1. Fetch main head, tree and relevant files. Inspect any new commits since the last handoff. Use a named task branch (e.g. work/p1-integrity) for large changes; never overwrite or force-push main.
2. Reproduce the defect with a fixture/test before editing when possible. Make small coherent commits, include tests and progress updates, retain snapshot data unless the task explicitly changes snapshot generation/schema.
3. Before publication inspect diff and latest main. If automatic snapshot refresh advanced main, rebase or merge safely, preserve newer data and verify final combined state. Do not apply old file contents over concurrent changes. Use expected head/fast-forward checks.
4. Main is the published branch. A branch commit is not a main commit; verify branch head and CI after integration. Do not claim Pages deployment until observed. For schema migration, consider cached and still-deployed older clients.
5. Avoid broad rewrites and untested changes. No publishing known failing or unverified material changes as complete. If browser access is missing, document the exact limitation and keep visual/interaction-sensitive work pending verification. Use a separate branch rather than risking the accepted baseline.

## Testing and release checklist

- Run actual existing Node tests: node tests/analytics.test.mjs; node tests/insights.test.mjs; node tests/snapshot.test.mjs. Run syntax checks on touched modules. If only an equivalent simulated environment is available, state that accurately and obtain CI evidence separately.
- Test source schema/fixtures, exact numeric totals, zero/empty values, date boundaries, incomplete history, duplicate transactions, timeouts, source disagreement, fallback, cache migration and concurrent refresh as relevant. Do not run live snapshot generation merely to test UI changes.
- For data changes compare old/new results on the same fixed snapshot and explain intentional differences. Do not use a moving snapshot as a regression baseline.
- For UI changes verify both languages, representative widths (320, 375, 393, 768, 1024, 1440 px), mobile dates, long press vs scroll, charts, modal close, clipboard, PNG/CSV, and share capability as applicable. Capture actual browser screenshots for visual assertions; mock canvas and DOM tests are not pixel or real-device tests. Chromium, WebKit and actual iOS Safari are distinct verification scopes.
- Preserve cache busting for changed files/imports. Confirm no missing IDs or translations and no unintended changes in unrelated code.
- Publish only after applicable gates pass and authorized scope is respected. Record actual tested environment, commands and results, known limitations and commit link. Never claim full verification on evidence from source inspection alone.

## Session boundaries and recovery

A new chat should read current documents and latest main, then inspect any open task branch/commit referenced in ROADMAP.md. Start from its resume pointer, not from a guess or an old chat. Each task must leave a durable checkpoint with status, exact commit, changed files, test evidence, known blockers, and next action. If interrupted mid-task, continue from the recorded branch and verify the diff before further edits; do not repeat already completed work or reset main.

Keep sessions bounded by task or coherent stage. Split large stages into multiple chats when necessary. Before ending a session, update ROADMAP.md and, when architecture or decisions changed, PROJECT_CONTEXT.md. Avoid claiming background progress; only report actions actually performed.

## Reporting

Use Russian in chat unless requested otherwise. Give concise factual findings first; distinguish demonstrated defects from risks and suggestions. Report commit/branch, tests run, unresolved issues and deployment status. Do not invent test results, data, current provider limits, or user approvals. Preserve uncertainty around business attribution. Use AUDIT.md as historical evidence and ROADMAP.md as live task state.
