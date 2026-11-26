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
