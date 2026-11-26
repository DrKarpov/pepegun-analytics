# Pepegun Analytics

Independent on-chain analytics for the Pepegun fee collector on TON.

[Open dashboard](https://drkarpov.github.io/pepegun-analytics/)

## Features

- Wallet activity, audience growth and fee revenue in GRAM.
- Adaptive UTC chart intervals from 15 minutes to one month.
- Fee concentration, median fees, first-time payers, period comparisons and wallet return rates.
- Transaction links, CSV/PNG exports, English and Russian interfaces.

## Data

Toncenter API v3 and TonAPI v2 provide public transaction history. The daily GitHub Actions job validates continuity, compares indexers at a common transaction tip and publishes a minimized snapshot without unrelated sender addresses or full comments. The browser checks for updates every 15 minutes while open.

[Fee collector on Tonviewer](https://tonviewer.com/UQD-J5lB6VMC1Cyyz2bLEEflmiG0JRXv7fccO6olayRRqWrc)

Wallet counts represent addresses, not individual users. Fee revenue is gross incoming labelled fees, not net profit or verified trades. Return rates count wallets first seen in the selected period that have a complete follow-up window and return on a later UTC day within 7, 14 or 30 days.

## Development

```sh
python3 -m http.server 8000 --directory docs
node tests/analytics.test.mjs
node tests/insights.test.mjs
node scripts/snapshot.mjs
```

Independent community project, not an official Pepegun product.

Amounts are rounded only for display (up to four decimals); CSV retains exact nano-unit values. Period comparison is shown only when a full comparable earlier interval is available.
