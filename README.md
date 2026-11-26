# Pepegun Analytics

Independent on-chain analytics for the Pepegun fee collector on TON.

**[Open dashboard](https://drkarpov.github.io/pepegun-analytics/)**

## Features

- Unique and paying wallets, audience growth and daily, weekly and monthly activity.
- Fee revenue, payment counts, venue labels and wallet retention.
- Custom date ranges, CSV and PNG exports, English and Russian interfaces.
- Automatic refresh every 15 minutes while the dashboard is open.

## Data

Public transaction history is retrieved from Toncenter API v3 or TonAPI v2. The dashboard verifies history continuity, deduplicates full wallet addresses and transaction hashes, and retains the last successful snapshot in browser storage.

[Fee collector on Tonviewer](https://tonviewer.com/UQD-J5lB6VMC1Cyyz2bLEEflmiG0JRXv7fccO6olayRRqWrc)

Wallet counts represent addresses, not individual people. Revenue represents gross incoming transfers labelled as fees, not net profit or a verified count of trades. Calendar periods use UTC.

## Development

Static HTML, CSS and JavaScript. No build step or API key required.

```sh
python3 -m http.server 8000 --directory docs
node tests/analytics.test.mjs
```

Independent community project. Not affiliated with or endorsed by Pepegun.
