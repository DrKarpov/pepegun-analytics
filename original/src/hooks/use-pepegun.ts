import { useCallback, useEffect, useRef, useState } from "react";
import { runSync, type Cache, type Progress } from "@/lib/pepegun/api";
import { clearCache, loadCache, saveCache } from "@/lib/pepegun/cache";
import { REFRESH_MS } from "@/lib/pepegun/config";

/**
 * Loads the last successful dataset from the browser, then refreshes from the
 * public API on open, every 15 minutes while the page is open, when the tab
 * becomes visible again after 15 minutes, and on demand.
 */
export function usePepegun() {
  const [cache, setCache] = useState<Cache | null>(null);
  const [booted, setBooted] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [persisted, setPersisted] = useState(true);
  const [now, setNow] = useState<number | null>(null);
  const cacheRef = useRef<Cache | null>(null);
  const runRef = useRef<AbortController | null>(null);

  const refresh = useCallback(async (forceFull = false) => {
    if (runRef.current) return;
    const ac = new AbortController();
    runRef.current = ac;
    setSyncing(true);
    setError(null);
    try {
      if (forceFull) await clearCache();
      const next = await runSync(cacheRef.current, { signal: ac.signal, forceFull, onProgress: setProgress });
      if (ac.signal.aborted) return;
      cacheRef.current = next;
      setCache(next);
      setPersisted(await saveCache(next));
    } catch (e) {
      if (!ac.signal.aborted) setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      if (runRef.current === ac) {
        runRef.current = null;
        setSyncing(false);
        setProgress(null);
        setNow(Date.now());
      }
    }
  }, []);

  useEffect(() => {
    let alive = true;
    setNow(Date.now());
    void (async () => {
      const stored = await loadCache();
      if (!alive) return;
      if (stored) {
        cacheRef.current = stored;
        setCache(stored);
      }
      setBooted(true);
      void refresh();
    })();
    const every = setInterval(() => void refresh(), REFRESH_MS);
    const tick = setInterval(() => setNow(Date.now()), 60_000);
    const onVisible = () => {
      const last = cacheRef.current?.lastSuccess ?? 0;
      if (document.visibilityState === "visible" && Date.now() - last > REFRESH_MS) void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      alive = false;
      clearInterval(every);
      clearInterval(tick);
      document.removeEventListener("visibilitychange", onVisible);
      runRef.current?.abort();
      runRef.current = null;
    };
  }, [refresh]);

  return { cache, booted, syncing, progress, error, persisted, now, refresh };
}