/**
 * Tiny in-process LRU with TTL. Survives only the lifetime of the Next.js
 * server process, but that's enough to dedupe within a single user's session
 * and across the search → detail navigation. For multi-instance deploys,
 * swap this for Vercel KV / Redis behind the same interface.
 */
interface Entry<V> {
  value: V;
  expiresAt: number;
}

export class TtlCache<V> {
  private store = new Map<string, Entry<V>>();
  constructor(
    private readonly maxEntries: number,
    private readonly ttlMs: number,
  ) {}

  get(key: string): V | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    // Refresh recency
    this.store.delete(key);
    this.store.set(key, entry);
    return entry.value;
  }

  set(key: string, value: V): void {
    if (this.store.has(key)) this.store.delete(key);
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
    while (this.store.size > this.maxEntries) {
      const oldest = this.store.keys().next().value;
      if (oldest === undefined) break;
      this.store.delete(oldest);
    }
  }
}
