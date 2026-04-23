const cache = new Map<string, { data: any; expiresAt: number }>();

export function getCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

export function setCache(key: string, data: any, ttlSeconds: number = 300) {
  cache.set(key, { data, expiresAt: Date.now() + ttlSeconds * 1000 });
}

export function invalidateCache(pattern?: string) {
  if (!pattern) {
    cache.clear();
    return;
  }
  const keysToDelete: string[] = [];
  cache.forEach((_value, key) => {
    if (key.includes(pattern)) keysToDelete.push(key);
  });
  keysToDelete.forEach((key) => cache.delete(key));
}
