const store = new Map();

export function rateLimit(ip, key, limit = 5, windowMs = 60_000) {
  const now = Date.now();
  const k = `${ip}:${key}`;
  const entry = store.get(k) || { count: 0, reset: now + windowMs };
  if (now > entry.reset) {
    entry.count = 0;
    entry.reset = now + windowMs;
  }
  entry.count++;
  store.set(k, entry);
  if (store.size > 5000) {
    for (const [id, val] of store) {
      if (now > val.reset) store.delete(id);
    }
  }
  return entry.count <= limit;
}
