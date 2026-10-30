import fetch from 'node-fetch';

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const TIMEOUT_MS = 10000;
const USER_AGENT = 'RouteWiseAI/1.0';

interface CacheEntry {
  data: NominatimResult[];
  expiresAt: number;
}

export interface NominatimResult {
  displayName: string;
  lat: number;
  lon: number;
  boundingbox: [string, string, string, string];
}

const cache = new Map<string, CacheEntry>();

function isExpired(entry: CacheEntry): boolean {
  return Date.now() > entry.expiresAt;
}

function pruneCache(): void {
  for (const [key, entry] of cache.entries()) {
    if (isExpired(entry)) {
      cache.delete(key);
    }
  }
}

/**
 * Search for addresses using Nominatim with in-memory caching.
 */
export async function geocodeAddress(query: string): Promise<NominatimResult[]> {
  pruneCache();

  const cacheKey = query.toLowerCase().trim();
  const cached = cache.get(cacheKey);
  if (cached && !isExpired(cached)) {
    return cached.data;
  }

  const params = new URLSearchParams({
    q: query,
    format: 'json',
    limit: '5',
    addressdetails: '1',
  });

  const url = `${NOMINATIM_BASE}/search?${params.toString()}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept-Language': 'en',
      },
      signal: controller.signal as Parameters<typeof fetch>[1] extends { signal?: infer S } ? S : never,
    });

    if (!response.ok) {
      throw new Error(`Nominatim HTTP error: ${response.status} ${response.statusText}`);
    }

    const raw = (await response.json()) as Array<{
      display_name: string;
      lat: string;
      lon: string;
      boundingbox: [string, string, string, string];
    }>;

    const results: NominatimResult[] = raw.map((item) => ({
      displayName: item.display_name,
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
      boundingbox: item.boundingbox,
    }));

    cache.set(cacheKey, {
      data: results,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    return results;
  } finally {
    clearTimeout(timeoutId);
  }
}
