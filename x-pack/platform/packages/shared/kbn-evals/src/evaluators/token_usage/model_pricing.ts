/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/**
 * Per-token pricing for an LLM model.
 *
 * Pricing data sourced from:
 * - https://github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json
 * - https://openai.com/api/pricing/
 * - https://www.anthropic.com/pricing
 * - https://ai.google.dev/gemini-api/docs/pricing
 */

export interface ModelPricing {
  /** Cost in USD per single input token */
  inputCostPerToken: number;
  /** Cost in USD per single output token */
  outputCostPerToken: number;
}

/**
 * Curated pricing map for commonly-used LLM models.
 *
 * Keys are canonical model identifiers (lower-cased). The fuzzy resolver
 * handles aliases and partial matches so callers don't need to know exact keys.
 *
 * Last updated: 2025-09 (verify against provider pages when adding models).
 */
const MODEL_PRICING: Record<string, ModelPricing> = {
  // ── OpenAI ──────────────────────────────────────────────
  'gpt-4.1': { inputCostPerToken: 2e-6, outputCostPerToken: 8e-6 },
  'gpt-4.1-mini': { inputCostPerToken: 4e-7, outputCostPerToken: 1.6e-6 },
  'gpt-4.1-nano': { inputCostPerToken: 1e-7, outputCostPerToken: 4e-7 },
  'gpt-4o': { inputCostPerToken: 2.5e-6, outputCostPerToken: 1e-5 },
  'gpt-4o-mini': { inputCostPerToken: 1.5e-7, outputCostPerToken: 6e-7 },
  'gpt-4-turbo': { inputCostPerToken: 1e-5, outputCostPerToken: 3e-5 },
  'gpt-4': { inputCostPerToken: 3e-5, outputCostPerToken: 6e-5 },
  'gpt-3.5-turbo': { inputCostPerToken: 5e-7, outputCostPerToken: 1.5e-6 },
  'o1': { inputCostPerToken: 1.5e-5, outputCostPerToken: 6e-5 },
  'o1-mini': { inputCostPerToken: 1.1e-6, outputCostPerToken: 4.4e-6 },
  'o3': { inputCostPerToken: 2e-6, outputCostPerToken: 8e-6 },
  'o3-mini': { inputCostPerToken: 1.1e-6, outputCostPerToken: 4.4e-6 },
  'o4-mini': { inputCostPerToken: 1.1e-6, outputCostPerToken: 4.4e-6 },

  // ── Anthropic ───────────────────────────────────────────
  'claude-opus-4': { inputCostPerToken: 1.5e-5, outputCostPerToken: 7.5e-5 },
  'claude-sonnet-4': { inputCostPerToken: 3e-6, outputCostPerToken: 1.5e-5 },
  'claude-sonnet-4.5': { inputCostPerToken: 3e-6, outputCostPerToken: 1.5e-5 },
  'claude-3.7-sonnet': { inputCostPerToken: 3e-6, outputCostPerToken: 1.5e-5 },
  'claude-3.5-sonnet': { inputCostPerToken: 3e-6, outputCostPerToken: 1.5e-5 },
  'claude-3.5-haiku': { inputCostPerToken: 8e-7, outputCostPerToken: 4e-6 },
  'claude-3-opus': { inputCostPerToken: 1.5e-5, outputCostPerToken: 7.5e-5 },
  'claude-3-sonnet': { inputCostPerToken: 3e-6, outputCostPerToken: 1.5e-5 },
  'claude-3-haiku': { inputCostPerToken: 2.5e-7, outputCostPerToken: 1.25e-6 },

  // ── Google Gemini ───────────────────────────────────────
  'gemini-2.5-pro': { inputCostPerToken: 1.25e-6, outputCostPerToken: 1e-5 },
  'gemini-2.5-flash': { inputCostPerToken: 1.5e-7, outputCostPerToken: 6e-7 },
  'gemini-2.0-flash': { inputCostPerToken: 1e-7, outputCostPerToken: 4e-7 },
  'gemini-1.5-pro': { inputCostPerToken: 1.25e-6, outputCostPerToken: 5e-6 },
  'gemini-1.5-flash': { inputCostPerToken: 7.5e-8, outputCostPerToken: 3e-7 },

  // ── Amazon Bedrock (cross-region ids) ───────────────────
  'amazon.nova-pro-v1:0': { inputCostPerToken: 8e-7, outputCostPerToken: 3.2e-6 },
  'amazon.nova-lite-v1:0': { inputCostPerToken: 6e-8, outputCostPerToken: 2.4e-7 },
  'amazon.nova-micro-v1:0': { inputCostPerToken: 3.5e-8, outputCostPerToken: 1.4e-7 },

  // ── Meta Llama (via common providers) ───────────────────
  'llama-3.3-70b': { inputCostPerToken: 5.9e-7, outputCostPerToken: 7.9e-7 },
  'llama-3.1-405b': { inputCostPerToken: 3e-6, outputCostPerToken: 3e-6 },
  'llama-3.1-70b': { inputCostPerToken: 5.9e-7, outputCostPerToken: 7.9e-7 },
  'llama-3.1-8b': { inputCostPerToken: 5.5e-8, outputCostPerToken: 7.7e-8 },

  // ── Mistral ─────────────────────────────────────────────
  'mistral-large': { inputCostPerToken: 2e-6, outputCostPerToken: 6e-6 },
  'mistral-medium': { inputCostPerToken: 2.7e-6, outputCostPerToken: 8.1e-6 },
  'mistral-small': { inputCostPerToken: 1e-7, outputCostPerToken: 3e-7 },

  // ── DeepSeek ────────────────────────────────────────────
  'deepseek-chat': { inputCostPerToken: 1.4e-7, outputCostPerToken: 2.8e-7 },
  'deepseek-reasoner': { inputCostPerToken: 5.5e-7, outputCostPerToken: 2.19e-6 },
};

/**
 * Alias map for common model name variations → canonical pricing key.
 *
 * Aliases are checked before fuzzy prefix matching.
 */
const MODEL_ALIASES: Record<string, string> = {
  // OpenAI dated snapshots
  'gpt-4.1-2025-04-14': 'gpt-4.1',
  'gpt-4.1-mini-2025-04-14': 'gpt-4.1-mini',
  'gpt-4.1-nano-2025-04-14': 'gpt-4.1-nano',
  'gpt-4o-2024-11-20': 'gpt-4o',
  'gpt-4o-2024-08-06': 'gpt-4o',
  'gpt-4o-2024-05-13': 'gpt-4o',
  'gpt-4o-mini-2024-07-18': 'gpt-4o-mini',
  'gpt-4-turbo-2024-04-09': 'gpt-4-turbo',
  'gpt-4-0613': 'gpt-4',
  'gpt-3.5-turbo-0125': 'gpt-3.5-turbo',

  // Anthropic dated snapshots
  'claude-opus-4-20250514': 'claude-opus-4',
  'claude-opus-4-1-20250805': 'claude-opus-4',
  'claude-sonnet-4-20250514': 'claude-sonnet-4',
  'claude-sonnet-4-5-20250929': 'claude-sonnet-4.5',
  'claude-4.5-sonnet': 'claude-sonnet-4.5',
  'claude-4-sonnet': 'claude-sonnet-4',
  'claude-4-opus': 'claude-opus-4',
  'claude-3-7-sonnet-20250219': 'claude-3.7-sonnet',
  'claude-3-5-sonnet-20241022': 'claude-3.5-sonnet',
  'claude-3-5-sonnet-20240620': 'claude-3.5-sonnet',
  'claude-3-5-haiku-20241022': 'claude-3.5-haiku',
  'claude-3-opus-20240229': 'claude-3-opus',
  'claude-3-sonnet-20240229': 'claude-3-sonnet',
  'claude-3-haiku-20240307': 'claude-3-haiku',

  // Google version variants
  'gemini-2.5-pro-preview': 'gemini-2.5-pro',
  'gemini-2.5-flash-preview': 'gemini-2.5-flash',
  'gemini-2.0-flash-exp': 'gemini-2.0-flash',
  'gemini-1.5-pro-latest': 'gemini-1.5-pro',
  'gemini-1.5-flash-latest': 'gemini-1.5-flash',
  'gemini-pro': 'gemini-1.5-pro',

  // Common short-hand / typos
  'sonnet-4.5': 'claude-sonnet-4.5',
  'sonnet-4': 'claude-sonnet-4',
  'opus-4': 'claude-opus-4',
  'sonnet45': 'claude-sonnet-4.5',
  'sonnet4': 'claude-sonnet-4',
  'gpt41': 'gpt-4.1',
  'gpt4o': 'gpt-4o',
  'gemini25pro': 'gemini-2.5-pro',
};

/**
 * Resolve pricing for a model name.
 *
 * Resolution order:
 *   1. Exact match in `MODEL_PRICING`
 *   2. Exact match in `MODEL_ALIASES` → pricing lookup
 *   3. Best prefix match among all pricing keys and alias keys
 *
 * Returns `undefined` when the model cannot be resolved.
 */
export const resolveModelPricing = (model: string): ModelPricing | undefined => {
  const normalized = model.toLowerCase().trim();

  // 1. Exact match in pricing map
  if (MODEL_PRICING[normalized]) {
    return MODEL_PRICING[normalized];
  }

  // 2. Exact alias match
  const aliasKey = MODEL_ALIASES[normalized];
  if (aliasKey && MODEL_PRICING[aliasKey]) {
    return MODEL_PRICING[aliasKey];
  }

  // 3. Best prefix match — longest matching key wins
  let bestMatch: string | undefined;
  let bestLen = 0;

  for (const key of Object.keys(MODEL_PRICING)) {
    if (normalized.startsWith(key) && key.length > bestLen) {
      bestMatch = key;
      bestLen = key.length;
    }
  }

  // Also check if the model starts with an alias prefix
  for (const [alias, target] of Object.entries(MODEL_ALIASES)) {
    if (normalized.startsWith(alias) && alias.length > bestLen) {
      bestMatch = target;
      bestLen = alias.length;
    }
  }

  return bestMatch ? MODEL_PRICING[bestMatch] : undefined;
};

/**
 * Calculate cost in USD from token counts and a resolved pricing.
 */
export const calculateCost = (
  inputTokens: number,
  outputTokens: number,
  pricing: ModelPricing
): number => {
  return inputTokens * pricing.inputCostPerToken + outputTokens * pricing.outputCostPerToken;
};
