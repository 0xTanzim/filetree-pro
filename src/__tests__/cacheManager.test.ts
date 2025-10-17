/**
 * Tests for LRU Cache Manager with TTL
 * Validates caching behavior, eviction, and expiration
 *
 * @author FileTree Pro Team
 * @since 0.2.0
 */

import { CacheManager, createCache } from '../utils/cacheManager';

describe('CacheManager', () => {
  describe('Basic Operations', () => {
    let cache: CacheManager<string, number>;

    beforeEach(() => {
      cache = new CacheManager<string, number>(3, 1000); // 3 entries, 1 second TTL
    });

    test('should set and get values', () => {
      cache.set('key1', 100);
      expect(cache.get('key1')).toBe(100);
    });

    test('should return undefined for non-existent keys', () => {
      expect(cache.get('non-existent')).toBeUndefined();
    });

    test('should update existing values', () => {
      cache.set('key1', 100);
      cache.set('key1', 200);
      expect(cache.get('key1')).toBe(200);
    });

    test('should check key existence', () => {
      cache.set('key1', 100);
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('key2')).toBe(false);
    });

    test('should delete values', () => {
      cache.set('key1', 100);
      expect(cache.delete('key1')).toBe(true);
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.delete('key1')).toBe(false);
    });

    test('should clear all entries', () => {
      cache.set('key1', 100);
      cache.set('key2', 200);
      cache.set('key3', 300);

      const cleared = cache.clear();
      expect(cleared).toBe(3);
      expect(cache.size()).toBe(0);
    });

    test('should track cache size', () => {
      expect(cache.size()).toBe(0);
      cache.set('key1', 100);
      expect(cache.size()).toBe(1);
      cache.set('key2', 200);
      expect(cache.size()).toBe(2);
      cache.delete('key1');
      expect(cache.size()).toBe(1);
    });
  });

  describe('LRU Eviction', () => {
    let cache: CacheManager<string, number>;

    beforeEach(() => {
      cache = new CacheManager<string, number>(3, 60000); // 3 entries, 1 minute TTL
    });

    test('should evict least recently used when capacity reached', () => {
      cache.set('key1', 100);
      cache.set('key2', 200);
      cache.set('key3', 300);
      cache.set('key4', 400); // Should evict key1

      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(true);
      expect(cache.has('key3')).toBe(true);
      expect(cache.has('key4')).toBe(true);
    });

    test('should update LRU order on get', () => {
      cache.set('key1', 100);
      cache.set('key2', 200);
      cache.set('key3', 300);

      cache.get('key1'); // Move key1 to head
      cache.set('key4', 400); // Should evict key2

      expect(cache.has('key1')).toBe(true);
      expect(cache.has('key2')).toBe(false);
      expect(cache.has('key3')).toBe(true);
      expect(cache.has('key4')).toBe(true);
    });

    test('should update LRU order on set existing key', () => {
      cache.set('key1', 100);
      cache.set('key2', 200);
      cache.set('key3', 300);

      cache.set('key1', 150); // Move key1 to head
      cache.set('key4', 400); // Should evict key2

      expect(cache.has('key1')).toBe(true);
      expect(cache.has('key2')).toBe(false);
      expect(cache.has('key3')).toBe(true);
      expect(cache.has('key4')).toBe(true);
    });
  });

  describe('TTL Expiration', () => {
    let cache: CacheManager<string, number>;

    beforeEach(() => {
      cache = new CacheManager<string, number>(10, 100); // 10 entries, 100ms TTL
    });

    test('should expire entries after TTL', async () => {
      cache.set('key1', 100);
      expect(cache.get('key1')).toBe(100);

      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(cache.get('key1')).toBeUndefined();
    });

    test('should return false for has() on expired entries', async () => {
      cache.set('key1', 100);
      expect(cache.has('key1')).toBe(true);

      await new Promise(resolve => setTimeout(resolve, 150));

      expect(cache.has('key1')).toBe(false);
    });

    test('should cleanup expired entries', async () => {
      cache.set('key1', 100);
      cache.set('key2', 200);
      cache.set('key3', 300);

      await new Promise(resolve => setTimeout(resolve, 150));

      const expired = cache.cleanup();
      expect(expired).toBe(3);
      expect(cache.size()).toBe(0);
    });

    test('should not cleanup non-expired entries', async () => {
      cache.set('key1', 100);

      await new Promise(resolve => setTimeout(resolve, 50)); // Wait less than TTL

      const expired = cache.cleanup();
      expect(expired).toBe(0);
      expect(cache.has('key1')).toBe(true);
    });
  });

  describe('Statistics', () => {
    let cache: CacheManager<string, number>;

    beforeEach(() => {
      cache = new CacheManager<string, number>(10, 60000);
    });

    test('should track hits and misses', () => {
      cache.set('key1', 100);

      cache.get('key1'); // Hit
      cache.get('key2'); // Miss
      cache.get('key1'); // Hit
      cache.get('key3'); // Miss

      const stats = cache.getStatistics();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(2);
      expect(stats.hitRate).toBe(0.5);
    });

    test('should track evictions', () => {
      const smallCache = new CacheManager<string, number>(2, 60000);

      smallCache.set('key1', 100);
      smallCache.set('key2', 200);
      smallCache.set('key3', 300); // Evicts key1

      const stats = smallCache.getStatistics();
      expect(stats.evictions).toBe(1);
    });

    test('should track expirations', async () => {
      const shortTTL = new CacheManager<string, number>(10, 100); // 100ms TTL

      shortTTL.set('key1', 100);
      await new Promise(resolve => setTimeout(resolve, 150));

      shortTTL.cleanup();
      const stats = shortTTL.getStatistics();
      expect(stats.expirations).toBe(1);
    });

    test('should calculate correct hit rate', () => {
      cache.set('key1', 100);

      cache.get('key1'); // Hit
      cache.get('key1'); // Hit
      cache.get('key1'); // Hit
      cache.get('key2'); // Miss

      const stats = cache.getStatistics();
      expect(stats.hitRate).toBe(0.75);
    });

    test('should handle zero accesses gracefully', () => {
      const stats = cache.getStatistics();
      expect(stats.hitRate).toBe(0);
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
    });

    test('should reset statistics', () => {
      cache.set('key1', 100);
      cache.get('key1');
      cache.get('key2');

      cache.resetStatistics();
      const stats = cache.getStatistics();

      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.evictions).toBe(0);
      expect(stats.expirations).toBe(0);
    });
  });

  describe('Cache Entry Metadata', () => {
    let cache: CacheManager<string, number>;

    beforeEach(() => {
      cache = new CacheManager<string, number>(10, 60000);
    });

    test('should return entry with metadata', () => {
      cache.set('key1', 100);
      cache.get('key1'); // Access once
      cache.get('key1'); // Access twice

      const entry = cache.getEntry('key1');
      expect(entry).toBeDefined();
      expect(entry?.value).toBe(100);
      expect(entry?.accessCount).toBe(2);
      expect(entry?.timestamp).toBeLessThanOrEqual(Date.now());
    });

    test('should return undefined for non-existent entry', () => {
      const entry = cache.getEntry('non-existent');
      expect(entry).toBeUndefined();
    });

    test('should not update LRU on getEntry', () => {
      const smallCache = new CacheManager<string, number>(2, 60000);

      smallCache.set('key1', 100);
      smallCache.set('key2', 200);
      smallCache.getEntry('key1'); // Should NOT move to head
      smallCache.set('key3', 300); // Should still evict key1

      expect(smallCache.has('key1')).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    test('should throw on invalid capacity', () => {
      expect(() => new CacheManager(0, 1000)).toThrow();
      expect(() => new CacheManager(-1, 1000)).toThrow();
    });

    test('should throw on invalid TTL', () => {
      expect(() => new CacheManager(10, 0)).toThrow();
      expect(() => new CacheManager(10, -1)).toThrow();
    });

    test('should handle single-entry cache', () => {
      const cache = new CacheManager<string, number>(1, 60000);

      cache.set('key1', 100);
      expect(cache.get('key1')).toBe(100);

      cache.set('key2', 200); // Evicts key1
      expect(cache.has('key1')).toBe(false);
      expect(cache.get('key2')).toBe(200);
    });

    test('should handle complex value types', () => {
      const cache = new CacheManager<string, object>(10, 60000);
      const value = { name: 'test', nested: { data: [1, 2, 3] } };

      cache.set('key1', value);
      expect(cache.get('key1')).toBe(value);
    });
  });

  describe('createCache helper', () => {
    test('should create cache with defaults', () => {
      const cache = createCache<string, number>();
      cache.set('key1', 100);
      expect(cache.get('key1')).toBe(100);
    });

    test('should create cache with custom settings', () => {
      const cache = createCache<string, number>(50, 10); // 50 entries, 10 minutes
      const stats = cache.getStatistics();
      expect(stats.capacity).toBe(50);
    });
  });
});
