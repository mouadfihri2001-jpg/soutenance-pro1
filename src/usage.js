const LIMITS = { free: 3, offre: 60, max: 150 };

export function normalizeUsage(value) {
  if (!value || !Object.hasOwn(LIMITS, value.plan) || value.limit !== LIMITS[value.plan]
      || !Number.isInteger(value.used) || value.used < 0
      || !Number.isInteger(value.remaining) || value.remaining < 0 || value.remaining > value.limit
      || value.remaining !== Math.max(0, value.limit - value.used)
      || typeof value.resetsAt !== 'string' || !Number.isFinite(Date.parse(value.resetsAt))) return null;
  return { plan: value.plan, limit: value.limit, used: value.used, remaining: value.remaining, resetsAt: value.resetsAt };
}

export function usageAfterGeneration(current, remaining) {
  if (!current || !Number.isInteger(remaining) || remaining < 0 || remaining > current.limit) return current;
  return { ...current, remaining, used: current.limit - remaining };
}

export function usageLimitReached(usage, serverBlocked = false) {
  return serverBlocked || usage?.remaining === 0;
}
