# Contributing

## Scope

- Preserve the established responsive RU/EN interface, branding, layout and export behavior. Avoid unrelated changes.
- Keep the site static and the data sources public. Do not add tracking, a backend, paid dependencies or a new data methodology without review.
- Preserve UTC ranges, integer nano-unit arithmetic, exact CSV totals, history validation, data-trust states and compatibility with published snapshots and older caches.

See [README.md](README.md) for architecture, methodology and test commands, and [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) for current release constraints.

## Changes and releases

1. Inspect current `main` before editing; automated snapshot commits can advance it.
2. Use a feature branch and pull request for substantive changes. Keep commits focused; reproduce defects with a test where practical.
3. Compare data changes against a fixed snapshot. Never overwrite a newer published snapshot with an older one. Use fast-forward updates or a reviewed merge; do not force-push `main`.
4. Update asset query versions when their targets change. Preserve matching versions in dependent imports and verify translations, element IDs and cache compatibility.
5. Merge after applicable checks pass. Verify deployment separately. Record the tested revision, test evidence and outstanding limitations; update project status when needed.

## Verification

- Run the syntax checks and four Node regression suites listed in the README.
- For history changes, check incomplete or duplicate transactions, predecessor links, incremental anchors, timeouts, indexer disagreement, cache migration and fallback behavior. Use read-only live diagnostics when necessary; do not regenerate a live snapshot just to test UI changes.
- For interface changes, run Chromium and WebKit regression suites in both languages at 320, 375, 393, 768, 1024 and 1440 px. Check layout, native date controls, chart selection and scrolling, hold gestures, modal dismissal, keyboard focus, clipboard fallback, PNG and CSV exports.
- Browser screenshots and decoded image comparisons are the visual evidence. Native iOS Safari, clipboard permission dialogs and system file sharing require separate device testing.

Code verification and snapshot generation are separate workflows. Documentation-only changes need link and content review, not a full application test run.
