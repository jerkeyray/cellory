/**
 * Simple in-memory cache for comparison results
 * 5-minute TTL to improve compare page performance
 */

interface CacheEntry {
  data: any;
  timestamp: number;
  userId: string;
}

const comparisonCache: Map<string, CacheEntry> = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(userId: string): string {
  return `comparison_${userId}`;
}

export function getCachedComparison(userId: string) {
  const cacheKey = getCacheKey(userId);
  const entry = comparisonCache.get(cacheKey);

  if (!entry) return null;

  const age = Date.now() - entry.timestamp;
  if (age > CACHE_TTL) {
    // Cache expired
    comparisonCache.delete(cacheKey);
    return null;
  }

  return entry.data;
}

export function setCachedComparison(userId: string, data: any) {
  const cacheKey = getCacheKey(userId);
  comparisonCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
    userId,
  });
}

export function invalidateComparisonCache(userId?: string) {
  if (userId) {
    comparisonCache.delete(getCacheKey(userId));
  } else {
    // Clear all cache
    comparisonCache.clear();
  }
}
