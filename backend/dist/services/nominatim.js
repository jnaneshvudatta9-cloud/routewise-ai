"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.geocodeAddress = geocodeAddress;
const node_fetch_1 = __importDefault(require("node-fetch"));
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const TIMEOUT_MS = 10000;
const USER_AGENT = 'RouteWiseAI/1.0';
const cache = new Map();
function isExpired(entry) {
    return Date.now() > entry.expiresAt;
}
function pruneCache() {
    for (const [key, entry] of cache.entries()) {
        if (isExpired(entry)) {
            cache.delete(key);
        }
    }
}
/**
 * Search for addresses using Nominatim with in-memory caching.
 */
async function geocodeAddress(query) {
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
        const response = await (0, node_fetch_1.default)(url, {
            headers: {
                'User-Agent': USER_AGENT,
                'Accept-Language': 'en',
            },
            signal: controller.signal,
        });
        if (!response.ok) {
            throw new Error(`Nominatim HTTP error: ${response.status} ${response.statusText}`);
        }
        const raw = (await response.json());
        const results = raw.map((item) => ({
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
    }
    finally {
        clearTimeout(timeoutId);
    }
}
