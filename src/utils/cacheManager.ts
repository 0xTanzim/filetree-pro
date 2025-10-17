/**
 * LRU (Least Recently Used) cache manager with TTL (Time To Live) support.
 * Implements efficient cache eviction to prevent memory leaks.
 *
 * Data Structure: Doubly-linked list + HashMap for O(1) operations
 *
 * @module cacheManager
 * @author FileTree Pro Team
 * @since 0.2.0
 */

/**
 * Node in the doubly-linked list for LRU cache
 * Each node stores a key-value pair with timestamp
 */
class CacheNode<K, V> {
  constructor(
    public key: K,
    public value: V,
    public timestamp: number,
    public prev: CacheNode<K, V> | null = null,
    public next: CacheNode<K, V> | null = null
  ) {}
}

/**
 * Cache entry metadata for telemetry and debugging
 */
export interface CacheEntry<V> {
  /** Cached value */
  readonly value: V;
  /** Timestamp when entry was created/updated */
  readonly timestamp: number;
  /** Number of times this entry was accessed */
  readonly accessCount: number;
}

/**
 * Cache statistics for monitoring and debugging
 */
export interface CacheStatistics {
  /** Current number of entries in cache */
  readonly size: number;
  /** Maximum capacity of cache */
  readonly capacity: number;
  /** Total cache hits */
  readonly hits: number;
  /** Total cache misses */
  readonly misses: number;
  /** Cache hit rate (0-1) */
  readonly hitRate: number;
  /** Number of evictions performed */
  readonly evictions: number;
  /** Number of expirations performed */
  readonly expirations: number;
}

/**
 * LRU Cache with TTL support for memory-efficient caching.
 *
 * Features:
 * - O(1) get, set, delete operations using HashMap + Doubly-linked list
 * - Automatic eviction of least recently used entries when capacity is reached
 * - Time-based expiration (TTL) for stale data removal
 * - Cache statistics for monitoring and optimization
 *
 * Time Complexity:
 * - get: O(1)
 * - set: O(1)
 * - delete: O(1)
 * - clear: O(n)
 * - cleanup: O(n) - should be called periodically, not on every operation
 *
 * Space Complexity: O(n) where n is the number of cached entries
 *
 * @template K - Key type (must be hashable)
 * @template V - Value type
 *
 * @example
 * ```typescript
 * const cache = new CacheManager<string, FileNode>(100, 5 * 60 * 1000); // 100 entries, 5min TTL
 *
 * cache.set('key', value);
 * const result = cache.get('key');
 * if (result) {
 *   console.log('Cache hit:', result);
 * }
 *
 * // Periodic cleanup (e.g., every 5 minutes)
 * setInterval(() => cache.cleanup(), 5 * 60 * 1000);
 * ```
 */
export class CacheManager<K, V> {
  private cache: Map<K, CacheNode<K, V>> = new Map();
  private head: CacheNode<K, V> | null = null; // Most recently used
  private tail: CacheNode<K, V> | null = null; // Least recently used

  private hits: number = 0;
  private misses: number = 0;
  private evictions: number = 0;
  private expirations: number = 0;
  private accessCounts: Map<K, number> = new Map();

  /**
   * Creates a new LRU cache with specified capacity and TTL.
   *
   * @param capacity - Maximum number of entries (default: 100)
   * @param ttl - Time to live in milliseconds (default: 5 minutes)
   */
  constructor(
    private readonly capacity: number = 100,
    private readonly ttl: number = 5 * 60 * 1000 // 5 minutes default
  ) {
    if (capacity <= 0) {
      throw new Error('Cache capacity must be positive');
    }
    if (ttl <= 0) {
      throw new Error('Cache TTL must be positive');
    }
  }

  /**
   * Gets a value from the cache.
   * Moves the accessed node to the head (most recently used).
   * Returns undefined if key doesn't exist or entry is expired.
   *
   * Time Complexity: O(1)
   *
   * @param key - The cache key
   * @returns The cached value or undefined if not found/expired
   */
  public get(key: K): V | undefined {
    const node = this.cache.get(key);

    if (!node) {
      this.misses++;
      return undefined;
    }

    // Check if entry has expired
    const now = Date.now();
    if (now - node.timestamp > this.ttl) {
      this.delete(key);
      this.expirations++;
      this.misses++;
      return undefined;
    }

    // Move to head (most recently used)
    this.moveToHead(node);

    // Update access count
    const currentCount = this.accessCounts.get(key) || 0;
    this.accessCounts.set(key, currentCount + 1);

    this.hits++;
    return node.value;
  }

  /**
   * Sets a value in the cache.
   * If key exists, updates value and moves to head.
   * If cache is full, evicts the least recently used entry.
   *
   * Time Complexity: O(1)
   *
   * @param key - The cache key
   * @param value - The value to cache
   */
  public set(key: K, value: V): void {
    const existingNode = this.cache.get(key);

    if (existingNode) {
      // Update existing entry
      existingNode.value = value;
      existingNode.timestamp = Date.now();
      this.moveToHead(existingNode);
    } else {
      // Create new entry
      const newNode = new CacheNode(key, value, Date.now());
      this.cache.set(key, newNode);
      this.addToHead(newNode);
      this.accessCounts.set(key, 0);

      // Evict least recently used if over capacity
      if (this.cache.size > this.capacity) {
        this.evictTail();
      }
    }
  }

  /**
   * Deletes a value from the cache.
   *
   * Time Complexity: O(1)
   *
   * @param key - The cache key to delete
   * @returns true if key existed and was deleted, false otherwise
   */
  public delete(key: K): boolean {
    const node = this.cache.get(key);

    if (!node) {
      return false;
    }

    this.removeNode(node);
    this.cache.delete(key);
    this.accessCounts.delete(key);

    return true;
  }

  /**
   * Checks if a key exists in the cache and is not expired.
   * Does NOT update LRU order (unlike get).
   *
   * Time Complexity: O(1)
   *
   * @param key - The cache key to check
   * @returns true if key exists and is not expired
   */
  public has(key: K): boolean {
    const node = this.cache.get(key);

    if (!node) {
      return false;
    }

    // Check if expired
    const now = Date.now();
    if (now - node.timestamp > this.ttl) {
      this.delete(key);
      this.expirations++;
      return false;
    }

    return true;
  }

  /**
   * Clears all entries from the cache.
   *
   * Time Complexity: O(n)
   *
   * @returns Number of entries cleared
   */
  public clear(): number {
    const size = this.cache.size;

    this.cache.clear();
    this.accessCounts.clear();
    this.head = null;
    this.tail = null;

    return size;
  }

  /**
   * Removes all expired entries from the cache.
   * Should be called periodically to prevent memory leaks.
   *
   * Time Complexity: O(n)
   *
   * @returns Number of expired entries removed
   */
  public cleanup(): number {
    const now = Date.now();
    let expiredCount = 0;
    const keysToDelete: K[] = [];

    // Collect expired keys
    for (const [key, node] of this.cache.entries()) {
      if (now - node.timestamp > this.ttl) {
        keysToDelete.push(key);
        expiredCount++;
      }
    }

    // Delete expired entries
    for (const key of keysToDelete) {
      this.delete(key);
    }

    this.expirations += expiredCount;
    return expiredCount;
  }

  /**
   * Gets the current size of the cache.
   *
   * Time Complexity: O(1)
   *
   * @returns Number of entries in cache
   */
  public size(): number {
    return this.cache.size;
  }

  /**
   * Gets cache statistics for monitoring and debugging.
   *
   * Time Complexity: O(1)
   *
   * @returns Cache statistics including hit rate, evictions, etc.
   */
  public getStatistics(): CacheStatistics {
    const totalAccesses = this.hits + this.misses;
    const hitRate = totalAccesses > 0 ? this.hits / totalAccesses : 0;

    return {
      size: this.cache.size,
      capacity: this.capacity,
      hits: this.hits,
      misses: this.misses,
      hitRate,
      evictions: this.evictions,
      expirations: this.expirations,
    };
  }

  /**
   * Gets detailed information about a cache entry.
   * Does NOT update LRU order.
   *
   * Time Complexity: O(1)
   *
   * @param key - The cache key
   * @returns Cache entry with metadata or undefined if not found
   */
  public getEntry(key: K): CacheEntry<V> | undefined {
    const node = this.cache.get(key);

    if (!node) {
      return undefined;
    }

    // Check if expired
    const now = Date.now();
    if (now - node.timestamp > this.ttl) {
      this.delete(key);
      this.expirations++;
      return undefined;
    }

    return {
      value: node.value,
      timestamp: node.timestamp,
      accessCount: this.accessCounts.get(key) || 0,
    };
  }

  /**
   * Resets cache statistics.
   * Useful for testing or periodic statistics reset.
   *
   * Time Complexity: O(1)
   */
  public resetStatistics(): void {
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
    this.expirations = 0;
  }

  // ==================== Private Helper Methods ====================

  /**
   * Adds a node to the head (most recently used position).
   *
   * Time Complexity: O(1)
   *
   * @param node - The node to add
   */
  private addToHead(node: CacheNode<K, V>): void {
    node.next = this.head;
    node.prev = null;

    if (this.head) {
      this.head.prev = node;
    }

    this.head = node;

    if (!this.tail) {
      this.tail = node;
    }
  }

  /**
   * Removes a node from the doubly-linked list.
   *
   * Time Complexity: O(1)
   *
   * @param node - The node to remove
   */
  private removeNode(node: CacheNode<K, V>): void {
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      this.head = node.next;
    }

    if (node.next) {
      node.next.prev = node.prev;
    } else {
      this.tail = node.prev;
    }
  }

  /**
   * Moves a node to the head (marks as most recently used).
   *
   * Time Complexity: O(1)
   *
   * @param node - The node to move
   */
  private moveToHead(node: CacheNode<K, V>): void {
    this.removeNode(node);
    this.addToHead(node);
  }

  /**
   * Evicts the tail node (least recently used).
   *
   * Time Complexity: O(1)
   */
  private evictTail(): void {
    if (!this.tail) {
      return;
    }

    const key = this.tail.key;
    this.removeNode(this.tail);
    this.cache.delete(key);
    this.accessCounts.delete(key);
    this.evictions++;
  }
}

/**
 * Creates a cache manager with default settings.
 * Convenience function for common use cases.
 *
 * @param capacity - Maximum number of entries (default: 100)
 * @param ttlMinutes - Time to live in minutes (default: 5)
 * @returns New CacheManager instance
 */
export function createCache<K, V>(
  capacity: number = 100,
  ttlMinutes: number = 5
): CacheManager<K, V> {
  return new CacheManager<K, V>(capacity, ttlMinutes * 60 * 1000);
}
