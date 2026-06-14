type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

type CacheResult<T> = {
  hit: boolean;
  value: T;
};

type CacheStore = Map<string, CacheEntry<unknown>>;

const globalCache = globalThis as typeof globalThis & {
  __kinshipServerCache?: CacheStore;
};

const cacheStore: CacheStore = globalCache.__kinshipServerCache || new Map();
globalCache.__kinshipServerCache = cacheStore;

export const cacheKeys = {
  churchSettings: "church-settings",
  birthdayMessages: "birthday-messages",
  roles: "roles",
  rolePermissions: (role: string) => `role-permissions:${role}`,
  units: "units",
  unit: (id: string) => `unit:${id}`,
  unitsManagement: "units-management",
};

export async function getCached<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>
): Promise<CacheResult<T>> {
  const now = Date.now();
  const entry = cacheStore.get(key) as CacheEntry<T> | undefined;

  if (entry && entry.expiresAt > now) {
    return { hit: true, value: entry.value };
  }

  const value = await loader();
  cacheStore.set(key, {
    expiresAt: now + ttlSeconds * 1000,
    value,
  });

  return { hit: false, value };
}

export function invalidateCache(keyOrPrefix: string) {
  for (const key of cacheStore.keys()) {
    if (key === keyOrPrefix || key.startsWith(`${keyOrPrefix}:`)) {
      cacheStore.delete(key);
    }
  }
}

export function clearServerCache() {
  cacheStore.clear();
}
