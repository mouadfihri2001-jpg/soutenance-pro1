import { HttpError } from './http.js';

export const MAX_OUTPUT_TOKENS = 4096;
// Standard text pricing in USD per million tokens. Unknown models fail closed
// until their pricing has been reviewed; this ledger is not a provider invoice.
const MODEL_RATES = Object.freeze({
  'claude-sonnet-5': { input: 2, output: 10 },
  'claude-sonnet-4-6': { input: 3, output: 15 }
});
const unavailable = () => new HttpError(503, 'La génération est temporairement indisponible. Réessaie plus tard.', 'service_budget_unavailable');

function limit(value, fallback, maximum) {
  const amount = value === undefined ? fallback : Number(value);
  if (!Number.isFinite(amount) || amount < 0.01 || amount > maximum) throw unavailable();
  return amount;
}

export function aiBudgetConfiguration(prompt, env = process.env) {
  const model = env.ANTHROPIC_MODEL || 'claude-sonnet-5';
  if (!Object.hasOwn(MODEL_RATES, model)) throw unavailable();
  const rates = MODEL_RATES[model];
  // One token per UTF-8 byte plus message overhead intentionally overestimates
  // ordinary text input. Reserve the full output allowance even for short replies.
  const inputTokens = Buffer.byteLength(JSON.stringify(prompt), 'utf8') + 1024;
  const estimatedUsd = Math.ceil((inputTokens * rates.input + MAX_OUTPUT_TOKENS * rates.output)) / 1_000_000;
  return {
    model, estimatedUsd,
    dailyLimit: limit(env.AI_DAILY_BUDGET_USD, 5, 1000),
    monthlyLimit: limit(env.AI_MONTHLY_BUDGET_USD, 30, 10000)
  };
}

export async function reserveAiBudget(admin, budget) {
  let result;
  try {
    result = await admin.rpc('student_reserve_ai_budget', {
      p_estimated_usd: budget.estimatedUsd,
      p_daily_limit: budget.dailyLimit,
      p_monthly_limit: budget.monthlyLimit
    });
  } catch { throw unavailable(); }
  if (result?.error || typeof result?.data?.allowed !== 'boolean') throw unavailable();
  if (!result.data.allowed) throw new HttpError(503, 'La génération est temporairement suspendue. Tes documents restent accessibles. Réessaie plus tard.', 'service_budget_exhausted');
  // Reservations are deliberately never refunded: errors, timeouts and failed
  // document writes may still incur provider costs, and repeated retries are paid.
}
