const _cache    = new Map<string, { data: unknown; ts: number }>();
const _inflight = new Map<string, Promise<unknown>>();
const TTL_MS = 5 * 60 * 1000; // 5 minutes

export function cached<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const entry = _cache.get(key);
    if (entry && Date.now() - entry.ts < TTL_MS) return Promise.resolve(entry.data as T);

    // Deduplicate concurrent calls for the same key (e.g. React StrictMode double-invoke)
    const inflight = _inflight.get(key);
    if (inflight) return inflight as Promise<T>;

    const promise = fetcher()
        .then(data => {
            _cache.set(key, { data, ts: Date.now() });
            _inflight.delete(key);
            return data;
        })
        .catch(err => {
            _inflight.delete(key);
            throw err;
        });

    _inflight.set(key, promise);
    return promise;
}

/** Call when data is mutated so next read refetches */
export function invalidate(key: string): void {
    _cache.delete(key);
}

/** Invalidates all cache entries whose key starts with the given prefix */
export function invalidateByPrefix(prefix: string): void {
    for (const key of _cache.keys()) {
        if (key.startsWith(prefix)) _cache.delete(key);
    }
}
