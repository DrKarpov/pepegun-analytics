# Pepegun Analytics

Independent on-chain analytics for the Pepegun fee collector on TON.

[Open dashboard](https://drkarpov.github.io/pepegun-analytics/)

## Features

- Wallet activity, audience growth and fee revenue in GRAM.
- Adaptive UTC chart intervals from 15 minutes to one month.
- Fee concentration, median fees, first-time payers, period comparisons and wallet return rates.
- Transaction links, CSV/PNG exports, English and Russian interfaces.

## Data

Toncenter API v3 and TonAPI v2 provide public transaction history. The daily GitHub Actions job validates continuity, compares indexers at a common transaction tip and tests the minimized snapshot before publication. If the alternate indexer is unavailable, the snapshot records that status; a detected disagreement blocks publication. Unrelated sender addresses and full comments are not retained. The browser checks for updates every 15 minutes while open.

[Fee collector on Tonviewer](https://tonviewer.com/UQD-J5lB6VMC1Cyyz2bLEEflmiG0JRXv7fccO6olayRRqWrc)

Wallet counts represent addresses, not individual users. Fee revenue is the total of incoming transfers marked `Pepegun fee`, not net profit or a count of trades. All amounts are in GRAM. Return rates count wallets first seen in the selected period that have a complete follow-up window and return on a later UTC day within 7, 14 or 30 days.

## Browser security

The static GitHub Pages document enforces Content Security Policy via an early HTML meta tag. Scripts and external stylesheets are same-origin only; inline scripts, eval, objects, frames, workers, forms and base URL changes are blocked. Inline style attributes remain permitted for dynamic chart legends and venue bars (the style-src fallback also permits inline styles on older browsers). Images are same-origin or blob URLs for SVG/PNG export. Fetch is limited to the site itself, Toncenter, TonAPI and the exact raw GitHub snapshot path. No data: image allowance or remote scripts are needed. External explorer and bot links remain ordinary navigations. GitHub Pages does not provide custom response headers here: a meta CSP cannot enforce frame-ancestors or report-only policies. This is defense in depth, not a guarantee of complete XSS protection or blockchain correctness.

## Development

```sh
python3 -m http.server 8000 --directory docs
node tests/analytics.test.mjs
node tests/insights.test.mjs
node tests/snapshot.test.mjs
# Refresh the public snapshot from the indexers:
node scripts/snapshot.mjs
```

Independent community project, not an official Pepegun product.

Amounts are rounded only for display (up to four decimals); CSV retains exact nano-unit values. Period comparison is shown only when a full comparable earlier interval is available.
