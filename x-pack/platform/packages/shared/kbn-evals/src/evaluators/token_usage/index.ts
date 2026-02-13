/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { Evaluator, TaskOutput } from '../../types';
import { resolveModelPricing, calculateCost } from './model_pricing';

interface ModelUsageStats {
  input_tokens?: number;
  output_tokens?: number;
  llm_calls?: number;
  model?: string;
  connector_id?: string;
}

/**
 * Evaluator that reports token-usage statistics and estimated cost.
 *
 * Score is the total number of tokens consumed. Metadata includes a
 * per-token breakdown and cost estimate based on per-model pricing
 * sourced from litellm / provider pricing pages.
 *
 * When the model is recognized, the cost is calculated using real
 * per-token rates. When unknown, cost is omitted (reported as `null`).
 */
export const createTokenUsageEvaluator = (): Evaluator => ({
  name: 'TokenUsage',
  kind: 'CODE' as const,
  evaluate: async ({ output }) => {
    const taskOutput = output as TaskOutput & { modelUsage?: ModelUsageStats };
    const modelUsage = taskOutput.modelUsage;

    const inputTokens = modelUsage?.input_tokens ?? 0;
    const outputTokens = modelUsage?.output_tokens ?? 0;
    const totalTokens = inputTokens + outputTokens;
    const llmCalls = modelUsage?.llm_calls ?? 0;
    const model = modelUsage?.model;

    const pricing = model ? resolveModelPricing(model) : undefined;
    const estimatedCostUsd = pricing
      ? Math.round(calculateCost(inputTokens, outputTokens, pricing) * 1_000_000) / 1_000_000
      : null;

    return {
      score: totalTokens,
      metadata: {
        source: 'direct',
        inputTokens,
        outputTokens,
        totalTokens,
        llmCalls,
        model,
        connectorId: modelUsage?.connector_id,
        estimatedCostUsd,
        pricingResolved: pricing != null,
        ...(pricing && {
          inputCostPerMToken: pricing.inputCostPerToken * 1_000_000,
          outputCostPerMToken: pricing.outputCostPerToken * 1_000_000,
        }),
      },
    };
  },
});

export { resolveModelPricing, calculateCost, type ModelPricing } from './model_pricing';
