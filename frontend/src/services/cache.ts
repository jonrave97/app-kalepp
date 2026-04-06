const _cache = new Map<string, { data: unknown; ts: number }>();
const TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function cached<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const entry = _cache.get(key);
    if (entry && Date.now() - entry.ts < TTL_MS) return entry.data as T;
    const data = await fetcher();
    _cache.set(key, { data, ts: Date.now() });
    return data;
}

/** Call when data is mutated so next read refetches */
export function invalidate(key: string): void {
    _cache.delete(key);
}
