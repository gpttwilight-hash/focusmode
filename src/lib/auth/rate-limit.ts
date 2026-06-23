type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

type RateLimitInput = {
  key: string;
  limit: number;
  windowMs: number;
};

export function checkRateLimit(input: RateLimitInput): boolean {
  const now = Date.now();
  const current = buckets.get(input.key);

  if (!current || current.resetAt <= now) {
    buckets.set(input.key, { count: 1, resetAt: now + input.windowMs });
    return true;
  }

  if (current.count >= input.limit) {
    return false;
  }

  current.count += 1;
  return true;
}
