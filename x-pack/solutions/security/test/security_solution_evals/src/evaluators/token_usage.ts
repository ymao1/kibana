/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { Evaluator, TaskOutput } from '@kbn/evals';

interface ModelUsageStats {
  input_tokens?: number;
  output_tokens?: number;
  llm_calls?: number;
  model?: string;
  connector_id?: string;
}

const INPUT_PRICE_PER_1K = 0.003;
const OUTPUT_PRICE_PER_1K = 0.015;

/**
 * Evaluator that reports token-usage statistics and estimated cost.
 *
 * Score is the total number of tokens consumed. Metadata includes a
 * per-token breakdown and a rough cost estimate.
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

    const estimatedCost =
      (inputTokens / 1000) * INPUT_PRICE_PER_1K + (outputTokens / 1000) * OUTPUT_PRICE_PER_1K;

    return {
      score: totalTokens,
      metadata: {
        source: 'direct',
        inputTokens,
        outputTokens,
        totalTokens,
        llmCalls,
        model: modelUsage?.model,
        connectorId: modelUsage?.connector_id,
        estimatedCostUsd: Math.round(estimatedCost * 10000) / 10000,
      },
    };
  },
});
