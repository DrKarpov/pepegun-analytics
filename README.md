# Pepegun Analytics

Independent on-chain analytics for the Pepegun fee collector on TON.

[Open dashboard](https://drkarpov.github.io/pepegun-analytics/)

## Features

- Wallet activity, audience growth, return rates and fee concentration
- Adaptive charts from 15-minute to monthly intervals
- Fee revenue in GRAM, comparable periods, transaction links and CSV/PNG exports
- English and Russian interfaces
- Refresh every 15 minutes while open

## Data

Public transaction history is retrieved from Toncenter API v3 or TonAPI v2. A daily GitHub Actions snapshot retains only fields needed for analytics and continuity checks. The secondary indexer is checked when available. Wallets are addresses, not people. Labelled fees are gross incoming transfers, not profit or verified trade count. All times are UTC.

[Fee collector on Tonviewer](https://tonviewer.com/UQD-J5lB6VMC1Cyyz2bLEEflmiG0JRXv7fccO6olayRRqWrc)

## Development

```sh
python3 -m http.server 8000 --directory docs
node tests/analytics.test.mjs
node tests/insights.test.mjs
```

Independent project, not an official Pepegun product.
