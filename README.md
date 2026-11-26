# Pepegun Analytics

Independent on-chain statistics for the public Pepegun TON fee collector.

## Hosting
A dependency-free static ES module site lives in `docs/`. On GitHub Pages, select **Deploy from a branch → main → /docs**. No backend, API key, wallet connection, payment or Lovable credits are needed. The page fetches and verifies the public account history on open, on demand and every 15 minutes while open; IndexedDB retains the last successful data.

## Development
Serve `docs/` over HTTP (for example `python3 -m http.server --directory docs 8000`). Run the fixture tests: `node tests/analytics.test.mjs`. The app supports EN/RU and uses UTC calendar-day windows, normalized complete sender addresses, exact nano-unit arithmetic, transaction-chain verification and explicit snapshot timestamps. Wallets are not people; labelled fees are gross incoming transfers, not net profit or verified trade count.

The original Lovable source is archived under `original/` (commit a6f19a4cf332ca39717a4c642fe46d8cf03b3d3c; old binary favicon and platform metadata omitted; supplied SVG logo included). The original snapshot is not the deployed static application. The project is independent, not an official Pepegun product.
