export class CacheIt<K = string, V = string> {
  private cache = new Map<K, { value: V; expireTime: number }>();

  set(key: K, value: V, expire: number) {
    const expireTime = Date.now() + expire;
    this.cache.set(key, { value, expireTime });
    setTimeout(() => {
      this.cache.delete(key);
    }, expire);
  }

  get(key: K) {
    if (!this.cache.has(key)) {
      return null;
    }
    const entry = this.cache.get(key);
    if (Date.now() > entry!.expireTime) {
      this.cache.delete(key);
      return null;
    }
    return entry!.value;
  }

  delete(key: K) {
    this.cache.delete(key);
  }

  has(key: K) {
    return this.cache.has(key);
  }
}
