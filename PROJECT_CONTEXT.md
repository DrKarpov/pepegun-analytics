# Current handoff — v29 / technical roadmap

**Read this first.** Accepted visual baseline v29 (6eedcb5), plus later reliability repairs and the approved startup screen. Main at start of P2-06: 301e60f8dc26f71ac78420dea40cf6590c343754. The repository, ROADMAP.md, AUDIT.md and DEVELOPMENT_RULES.md are the source of truth; inspect current main before changes. Keep approved design, all metrics, exports, and free static GitHub Pages.

P1 and P2-01/02 are implemented and verified. P1/02 integrity and cancellation: full live audit and actual Node/browser CI 45886228956. The TonAPI genesis-field omission was corrected; the later browser cache regression was fixed in d6c8042, with full audit and recovery CI 45887416044. User confirmed “Обновлено” on the live site. Automatic snapshot publication verified at 5ebb7f9 and f261e52 (3737 transactions, 3445 classified in the observed snapshot; not permanent constants). Startup screen outside roadmap merged at 2f9a5b3 after CI 45889000113: original logo, brand surface, green progress, 400 ms minimum, 220 ms fade, fail-open at eight seconds, reduced motion, initial navigation only. Live startup deployment was not independently observed.

P2-03 merged at 0a9e48fd98d473edc725d4db93a1e422944d2e88 after [CI 45890628491](https://github.com/drkarpov/pepegun-analytics/actions/runs/45890628491): full and incremental verification against the same real history, 38 vs 2 alternate-provider requests, all Node and browser tests passed. Snapshot 7d4a18f23b8a947cd2fb4cbeba6fb6043e04443a published complete proof for 3738 transactions and 3446 classified. User confirmed “Обновлено”. Seven previous tasks now DONE. Checkpoints are optional, digest-bound to full history, classified rows, ambiguity totals, source and full-audit date; stale or incomplete evidence falls back to full. Full primary validation, manual full audit and seven-day full revalidation remain. No methodology changes.

P2-04 merged c692e4ae906215ba25e6ad3c117753aa4583254a after [CI 45891943109](https://github.com/drkarpov/pepegun-analytics/actions/runs/45891943109). Native Chromium scroll, both browsers' native taps, synthetic gesture/cancel/pen, mouse, keyboard and card holds passed. User confirmed live release works; acceptance recorded in PR #7. Eight roadmap tasks DONE.

P2-05 merged 301e60f8dc26f71ac78420dea40cf6590c343754 after CI 45893505664 passed both engines, Node, real full/incremental checks and exported pixels. Returning #607367 and returning-only partial opacity 0.92; 3.46:1 opaque and 3.13:1 partial. Nine tasks DONE.

Current P2-06 branch work/p2-06-export-labels, checkpoint c6707d33b081b32153ae9a4f233cc9d49b171693. User screenshot: remove routine prior-history status from individual PNG. Green header period only; material stale/mismatch/unchecked/unavailable warnings on separate amber line. Active card uses range-end date with calendar days, not rolling range. UTC once near an actual clock, no UTC for date-only. App and card-export v38; global PNG, CSV and website unchanged. Tests added for all six cards EN/RU and period scopes, preview vs PNG pixels; CI pending. Next P2-07. Native iOS share and direct Pages access remain separate verification limits.

The historical notes below describe earlier iterations, including superseded requirements. They are retained for traceability; **latest v29 and rules take precedence**. In particular: v12 is only the preserved top-filter visual reference, not the current overall app baseline; date captions are now From/To without UTC; preview has no visible title, hint or close button; individual PNG has no creation timestamp or URL footer. Footer copy is the approved short v29 wording. Full methodology and exact data definitions remain.

---

# Pepegun Analytics — project handoff

Updated 2026-11-26. This file records the repository-backed context and the user's latest UI requirements, not a full transcript.

## Baseline and safety
- Live site: https://drkarpov.github.io/pepegun-analytics/
- Accepted visual baseline: v12, commit b167c6808e92b063cc0930936201055cdebfd108. Rejected v13: 7a5733b2523064303693b58f8d5587e468f5126b; it changed the top period tabs instead of just the custom date inputs. Never use v13 as design baseline.
- Do not rewrite the dashboard, change the analytics methodology, data, snapshot, application logic, exports, language translations or unrelated styling for visual-only requests. Use a separate branch and inspect changes before publication. Do not force-push main.
- Preserve the existing responsive dark UI, accent color, logo, footer links and chart layout. Avoid overlapping or clipped controls and unnecessary text/layout changes.

## Data and architecture (from README and source tree)
- Static GitHub Pages site under docs/. index.html and styles.css are presentation. app.mjs provides interface, localization, rendering and update orchestration; analytics.mjs and insights.mjs contain analytics logic. snapshot.json is the public history snapshot. scripts/snapshot.mjs and .github/workflows/snapshot.yml support snapshot validation and updates.
- Public TON fee collector: UQD-J5lB6VMC1Cyyz2bLEEflmiG0JRXv7fccO6olayRRqWrc. Toncenter API v3 and TonAPI v2. Incoming labelled Pepegun fee transfers represent gross fee revenue in GRAM, not net profit or trade count. Wallet counts are addresses, not people. UTC intervals. Display amounts up to four decimals; CSV preserves exact nano-units. Period comparison requires full comparable earlier interval. Return rates use complete follow-up windows and later UTC days. Browser checks for updates every 15 minutes while open. See README and source for exact formulas and edge cases.
- Existing tests: node tests/analytics.test.mjs; node tests/insights.test.mjs; node tests/snapshot.test.mjs. Do not claim tests passed without executing them. Keep snapshot refresh independent of UI changes.

## Latest user requirements
- Preserve top period tabs as in v12; only the two custom date inputs need distinct rounded controls with spacing and no overlap, including iOS. Center From/To (UTC) captions above their inputs.
- Improve refresh button without changing behavior. Align the status indicator's starting dot with the logo center.
- Unify KPI/card headings with the existing heading contrast and weight; slightly brighten secondary gray text, no global redesign.
- In fee revenue, GRAM belongs below the numeric amount. Center the comparison date line below the equal-length UTC interval note.
- Keep Tonviewer and PepeGunBot centered footer links. Both languages, mobile and desktop should remain legible and aligned.

## Handoff verification
- v14 candidate is based on v12 HTML/CSS plus narrow overrides only; the previous v13 commit is retained in history. Verify actual mobile Safari/desktop display and compare both languages, custom date input behavior, upper tabs and KPI layout before declaring UI accepted. A real-device Safari check has not yet been performed.

## v15 visual follow-up
- User rejected v14 visual misalignment: native date value was too high; fee amount and payment count were not aligned; headings too bold; refresh button too heavy. v15 shares label/value/hint grid rows across neighboring KPI cards, uses the existing hint row for GRAM, aligns detailed and return cards, softens labels, and adjusts native date controls and refresh icon. Only the KPI HTML template in app.mjs changes, not calculations or data.
- Local Chromium fixture passed 20 width/language combinations (320, 350, 375, 393, 414, 520, 768, 800, 1024, 1440 px × RU/EN) for KPI alignment and date non-overlap. This was a layout fixture, not the complete live site or iOS Safari. Real Safari display and live deployment still require verification.

## v16 detailed-statistics follow-up
- User screenshot identified misaligned detailed statistics and left-shifted retention cards on mobile. Use explicit full-width centered child tracks; retention cards use a normal single-column grid per card rather than row subgrid. Shortened per-payer label in both languages. Formula remains total labelled fees divided by distinct paying wallets in the period. Real iOS Safari verification remains open.

## v17 visual follow-up
- User screenshots: center the retention-card content as a compact group with equal top/bottom padding, make KPI and retention headings white while preserving muted explanatory text, and replace the refresh icon itself with a single-arrow variant without a surrounding ring/background. Preserve green loading state and rotation, click target, existing focus outline and all data/logic. Actual iOS rendering remains unverified until checked on device.

## v18 methodology polish and source audit
- User approved slightly lighter existing palette for the expanded methodology panel; no method text changes. Fee collector address is on its own line (footer retains the explorer link). Full address remains visible, wrapping only if the viewport requires it.
- Cross-check downloads full alternate-indexer history and compares the existing verified snapshot at its original tip. TonAPI uses 100 transactions per page and 1.5s pagination pauses; Toncenter uses 1000 and 1.15s. Network retries may take longer. No reduced validation or change to request throttling. The UI passes the existing progress callback, displays actual source/page/transaction counts and retry state; animated border is indeterminate, not a percentage. Existing colors and footer button shape are reused.

## v19 date labels and footer
- Removed redundant UTC from custom date input captions in EN/RU and initial HTML; UTC range annotation and all time calculations unchanged. PepeGunBot footer link uses the existing audit-sweep border animation, preserving button dimensions and reduced-motion preference. Tonviewer unchanged.

## v20 collector address
- Replaced full inline address with a single-line first/last 12-character abbreviation and copy control for the exact full address. Removed the redundant break before provider information. Clipboard success indicated by a checkmark; manual selectable address provided if copying fails. Explorer footer link and all analytics unchanged.

## v21 per-card PNG export
- Approved scope: overview (four metrics together), active wallets, new/returning wallets, growth, activity and fees charts. No venue/detail/transaction/method exports. Touch hold 600ms or desktop context menu; cancel on movement/scroll; chart plots and buttons excluded. Keyboard Enter/Shift+F10 available. One hint. Dialog with download and native file share when supported. Export uses frozen displayed values and existing SVG chart (including selected point), current period and data timestamp, original pepegun-logo.svg, independent branding and source URL. No third-party dependencies; original full dashboard exports unchanged. Real mobile browser and file-share behavior require verification.

## v22 compact individual export
- Approved: 600ms hold, 1.5% scale and green/teal animated outline only during hold, no pointer-focus ring, preserve keyboard focus. Compact methodology-colored preview dialog, close icon/backdrop/Escape, same PNG preview/download/share, reduced motion respected. Share hidden if native file sharing unavailable. Individual PNG: 16px outer padding, compact original logo and title, period and as-of line, no website/repo/footer; joined metric cells and active count before label. Full dashboard export and analytics unchanged.

## v23 focus and export time labels
- User screenshots showed persistent native focus rings on cards, chart SVG and close button after touch/open/close/download. Explicit pointer/keyboard modality suppresses pointer focus rings; keyboard access retained. Hold animation remains the only pointer-triggered card outline and is cleared on open/close. Close icon uses color/background for keyboard focus, no outline. Individual PNG uses one UTC marker only next to an actual clock time (timed range preferred, otherwise data timestamp); removes UTC from calendar subtitles and date-only ranges. Global export and on-site time calculations unchanged.

## v24 clean graph export and passive preview
- Remove only .cursor from the cloned chart SVG before serializing it; the live chart, selected-point readout, axes, series and legend remain unchanged. Applies to all three individual chart exports and their previews. Replace the modal img with a passive canvas drawing the exact generated PNG; disable context menu and dragging on its wrapper. Download/share still use the original PNG blob. This addresses the native iOS image callout and unintended enlargement without disabling normal page scrolling or pinch zoom. Real iOS verification remains required.

## v25 share without caption
- Native sharing passes only the PNG file (no title, text or URL). Branding is already embedded in the image. Download behavior unchanged.

## v26 scroll-safe long press
- Touch feedback starts only after 240ms stationary contact, export still opens after 600ms total. Movement of 8 CSS pixels or more, scrolling, release, cancellation, secondary pointers, window blur and hidden document cancel pending feedback and export. Touch-generated contextmenu cannot bypass the delay. Desktop and keyboard export unchanged.

## v27 translucent preview and quieter interface
- User requested subtle green translucent preview surface, with no visible Preview heading or persistent card export instruction. Preview uses 88% opaque dark green with backdrop blur and solid fallback; PNG itself stays opaque and unchanged. Dialog accessible heading and card aria-description remain available to assistive technology. No tracking, backend or new stored preferences. Hold timing, share/download and analytics unchanged.

## v28 tighter preview and PNG header
- Remove the visible close icon and its header row; retain the accessible dialog title without occupying layout, outside-tap and Escape dismissal. Green glass surface uses 48% opacity with 5px blur and 30% backdrop darkness (translucent fallback). Individual PNG removes the redundant as-of timestamp and its vertical space; centered branding and green period remain, UTC only on timed ranges. If the data is stale, keep its existing cached-data warning in the green period line only. All six card exports share this renderer. Global export and analytics unchanged.

## v29 footer copy
- Approved final cosmetic change: footer reads “Независимый дашборд сообщества Pepegun.” / “Independent Pepegun community dashboard.” Methodology, README, export disclaimers and analytics remain unchanged. Next phase: reliability, regression tests and code cleanup following the v28 audit.
