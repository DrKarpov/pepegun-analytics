# Project status

Updated 2026-11-26.

The initial 15-task reliability and maintainability roadmap is complete. The project is in maintenance; there is no open mandatory implementation stage.

## Verified release

- Implementation: [5bb3cab](https://github.com/drkarpov/pepegun-analytics/commit/5bb3cab798fad94ef2dcbdb8ac85ae74cfeda712), [PR #11](https://github.com/drkarpov/pepegun-analytics/pull/11).
- [PR verification](https://github.com/drkarpov/pepegun-analytics/actions/runs/45898705630) and [post-merge verification](https://github.com/drkarpov/pepegun-analytics/actions/runs/45899342027) passed: Node regressions, live full/incremental history checks, Chromium/WebKit, CSP, and baseline UI/export comparisons.
- [Pages deployment](https://github.com/drkarpov/pepegun-analytics/actions/runs/45899403149) succeeded. Later documentation-only updates do not alter the verified application.
- Full audit at the tested snapshot: 3,738 transactions and 3,446 classified rows. Incremental alternate-provider audit required 2 requests versus 38 for a full audit. These are observed test results, not current totals or guaranteed request counts.
- Baseline comparison: 24 browser/width/language combinations, matching visible text, SVG, geometry and computed styles; screenshot tolerance passed; exact CSV bytes and decoded PNG pixels matched.

## UI compatibility

- Preserve the accepted v29 visual baseline ([6eedcb5](https://github.com/drkarpov/pepegun-analytics/commit/6eedcb502bddc08581e9a0d269e55ce1b3721a08)) plus subsequent verified repairs and the startup screen. v12 is the reference for the top period tabs only.
- Keep the original logo, dark palette, centered metrics and footer links, compact status indicator, custom date controls with centered From/To labels, and the GRAM unit below fee revenue. Footer: “Independent Pepegun community dashboard.” / “Независимый дашборд сообщества Pepegun.”
- Individual PNG scope: overview, active wallets, new/returning, growth, activity and fees. Preserve global PNG and CSV. Card previews have no visible title, close icon or persistent hint. Dismiss outside or with Escape; share the PNG file only. Use the original logo, compact period/anchor, UTC once beside an actual time, material trust warnings separately, no routine prior-history label, creation timestamp or URL footer. Remove only the chart cursor from the exported SVG.
- Hold feedback begins at 240 ms; export at 600 ms; movement of 8 CSS px, scrolling, release, cancellation or secondary contact cancels pending hold. Keep pointer focus rings suppressed, keyboard access, and reduced-motion support. Chart scrolling must not select a point.
- Startup uses the original logo, 400 ms minimum, 220 ms fade, 8-second fail-open, and reduced motion. It appears on initial navigation, not refresh.

- Transaction list uses only the global time range; chart links open that list (growth/activity: all transfers; fees: fee transfers). Chart point selection changes readouts only. No local period reset or selected-interval label. The maintenance change is pending branch CI verification.

## Operations and limitations

- The browser refreshes every 15 minutes while visible. Keep validated local/published fallback, sticky mismatch handling, ordered LT/hash continuity and anchor checks. Audit deadline: 240 seconds; manual audit remains full. Generator audit can reuse a digest-bound checkpoint for up to seven days before full revalidation.
- Snapshot automation runs daily at 03:37 UTC, on manual dispatch and relevant data-code changes. Code verification is independent. Do not weaken integrity or change metric attribution to resolve a provider failure.
- Native iOS Safari behavior, system file sharing and actual clipboard permission dialogs still need device acceptance. Static meta CSP cannot enforce frame-ancestors or report-only; older browsers may permit inline style fallback. Indexer agreement does not establish business attribution.
- Use the latest repository state as the source of truth. Maintain [README.md](README.md) and [CONTRIBUTING.md](CONTRIBUTING.md); record new substantive changes and verification here.

## Historical records

The [original audit](archive/AUDIT.md) and [completed roadmap](archive/ROADMAP.md) preserve the findings, all 15 tasks and implementation evidence. Earlier design iterations and former development rules remain available at the immutable pre-reorganization revision: [project history](https://github.com/drkarpov/pepegun-analytics/blob/fd3c709d3072fc158cb0bc8b8c9be299469d7bbc/PROJECT_CONTEXT.md) and [previous rules](https://github.com/drkarpov/pepegun-analytics/blob/fd3c709d3072fc158cb0bc8b8c9be299469d7bbc/DEVELOPMENT_RULES.md). These are historical, not current requirements.
