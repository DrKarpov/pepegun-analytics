/** Public, read-only configuration. No secrets, no wallet connection. */
export const COLLECTOR_FRIENDLY = "UQD-J5lB6VMC1Cyyz2bLEEflmiG0JRXv7fccO6olayRRqWrc";
export const SOURCE_URL = `https://tonviewer.com/${COLLECTOR_FRIENDLY}`;
export const UNIT = "GRAM";
export const NANO = 1_000_000_000n;
export const REFRESH_MS = 15 * 60 * 1000;
export const STALE_MS = 20 * 60 * 1000;
export const CACHE_VERSION = 1;

export type SourceId = "toncenter" | "tonapi";

export const SOURCES: Record<
  SourceId,
  { label: string; pageSize: number; throttleMs: number; docs: string }
> = {
  toncenter: {
    label: "Toncenter API v3",
    pageSize: 1000,
    throttleMs: 1150,
    docs: "https://toncenter.com/api/v3/index.html",
  },
  tonapi: {
    label: "TonAPI v2",
    pageSize: 100,
    throttleMs: 1500,
    docs: "https://tonapi.io/api-v2",
  },
};