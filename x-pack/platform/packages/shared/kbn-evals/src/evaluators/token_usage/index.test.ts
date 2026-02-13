/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { createTokenUsageEvaluator } from '.';

const evaluate = createTokenUsageEvaluator().evaluate;

describe('TokenUsage evaluator', () => {
  it('returns total tokens as score', async () => {
    const result = await evaluate({
      input: {},
      output: {
        modelUsage: {
          input_tokens: 500,
          output_tokens: 300,
        },
      },
      expected: undefined,
      metadata: null,
    });
    expect(result.score).toBe(800);
  });

  it('returns 0 when no model usage data is present', async () => {
    const result = await evaluate({
      input: {},
      output: {},
      expected: undefined,
      metadata: null,
    });
    expect(result.score).toBe(0);
    expect(result.metadata).toMatchObject({
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      llmCalls: 0,
      pricingResolved: false,
    });
    expect(result.metadata?.estimatedCostUsd).toBeNull();
  });

  it('includes detailed metadata', async () => {
    const result = await evaluate({
      input: {},
      output: {
        modelUsage: {
          input_tokens: 1000,
          output_tokens: 500,
          llm_calls: 3,
          model: 'gpt-4.1',
          connector_id: 'conn-123',
        },
      },
      expected: undefined,
      metadata: null,
    });
    expect(result.metadata).toMatchObject({
      source: 'direct',
      inputTokens: 1000,
      outputTokens: 500,
      totalTokens: 1500,
      llmCalls: 3,
      model: 'gpt-4.1',
      connectorId: 'conn-123',
      pricingResolved: true,
    });
  });

  it('calculates estimated cost using real model pricing for gpt-4.1', async () => {
    const result = await evaluate({
      input: {},
      output: {
        modelUsage: {
          input_tokens: 1_000_000,
          output_tokens: 0,
          model: 'gpt-4.1',
        },
      },
      expected: undefined,
      metadata: null,
    });
    // GPT-4.1: input $2.00/1M tokens → 1M * 2e-6 = $2.00
    expect(result.metadata).toMatchObject({
      estimatedCostUsd: 2.0,
      pricingResolved: true,
      inputCostPerMToken: 2.0,
      outputCostPerMToken: 8.0,
    });
  });

  it('calculates estimated cost for claude-sonnet-4.5', async () => {
    const result = await evaluate({
      input: {},
      output: {
        modelUsage: {
          input_tokens: 1000,
          output_tokens: 1000,
          model: 'claude-sonnet-4.5',
        },
      },
      expected: undefined,
      metadata: null,
    });
    // Claude Sonnet 4.5: input $3/M, output $15/M
    // 1000 * 3e-6 + 1000 * 1.5e-5 = 0.003 + 0.015 = 0.018
    expect(result.metadata).toMatchObject({
      estimatedCostUsd: 0.018,
      pricingResolved: true,
    });
  });

  it('calculates estimated cost for gemini-2.5-pro', async () => {
    const result = await evaluate({
      input: {},
      output: {
        modelUsage: {
          input_tokens: 10000,
          output_tokens: 2000,
          model: 'gemini-2.5-pro',
        },
      },
      expected: undefined,
      metadata: null,
    });
    // Gemini 2.5 Pro: input $1.25/M, output $10/M
    // 10000 * 1.25e-6 + 2000 * 1e-5 = 0.0125 + 0.02 = 0.0325
    expect(result.metadata).toMatchObject({
      estimatedCostUsd: 0.0325,
      pricingResolved: true,
    });
  });

  it('returns null cost for unknown models', async () => {
    const result = await evaluate({
      input: {},
      output: {
        modelUsage: {
          input_tokens: 1000,
          output_tokens: 500,
          model: 'totally-unknown-model',
        },
      },
      expected: undefined,
      metadata: null,
    });
    expect(result.metadata).toMatchObject({
      estimatedCostUsd: null,
      pricingResolved: false,
    });
    // Should NOT have pricing fields
    expect(result.metadata).not.toHaveProperty('inputCostPerMToken');
  });

  it('handles partial model usage (only input_tokens)', async () => {
    const result = await evaluate({
      input: {},
      output: {
        modelUsage: {
          input_tokens: 200,
        },
      },
      expected: undefined,
      metadata: null,
    });
    expect(result.score).toBe(200);
    expect(result.metadata).toMatchObject({
      inputTokens: 200,
      outputTokens: 0,
      totalTokens: 200,
    });
  });
});
