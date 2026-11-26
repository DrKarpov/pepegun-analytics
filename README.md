# Pepegun Analytics

Independent on-chain analytics for the Pepegun fee collector on TON.

[Open dashboard](https://drkarpov.github.io/pepegun-analytics/)

## Features

- Wallet activity, audience growth and retention
- Fee revenue and payment statistics
- Activity by venue label
- Custom date ranges and CSV/PNG exports
- English and Russian interfaces
- Data refresh every 15 minutes while the page is open

## Data

Transaction history is retrieved from Toncenter API v3 or TonAPI v2.

[Fee collector on Tonviewer](https://tonviewer.com/UQD-J5lB6VMC1Cyyz2bLEEflmiG0JRXv7fccO6olayRRqWrc)

Wallet counts represent unique addresses, not individual users. Fee revenue represents gross incoming transfers labelled as fees, not net profit. All calendar periods use UTC.

## Extended analytics

Detailed statistics include median fees, revenue per paying address, fee concentration, new payers and comparable prior periods. Source comparison runs on request against the same transaction tip. Historical USD estimates use DefiLlama daily prices when available.

The public history snapshot is generated daily by GitHub Actions (also runnable manually). It contains normalized public account history, not estimated counters. On a first visit the dashboard validates the available snapshot before fetching newer transactions. If the snapshot is unavailable, it downloads the complete history from the indexer. To generate it locally, run `node scripts/snapshot.mjs`.

## Development

```sh
python3 -m http.server 8000 --directory docs
node tests/analytics.test.mjs
node tests/insights.test.mjs
```

This is an independent project, not an official Pepegun product.
