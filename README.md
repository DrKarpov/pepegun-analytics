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

An optional public history snapshot can be generated with `node scripts/snapshot.mjs` and committed as `docs/snapshot.json`. The site validates it before use and checks for newer transactions. No scheduled server job is required.

## Development

```sh
python3 -m http.server 8000 --directory docs
node tests/analytics.test.mjs
node tests/insights.test.mjs
```

This is an independent project, not an official Pepegun product.
