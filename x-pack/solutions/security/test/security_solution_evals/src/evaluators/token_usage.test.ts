/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { createTokenUsageEvaluator } from './token_usage';

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
    });
  });

  it('includes detailed metadata', async () => {
    const result = await evaluate({
      input: {},
      output: {
        modelUsage: {
          input_tokens: 1000,
          output_tokens: 500,
          llm_calls: 3,
          model: 'gpt-4',
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
      model: 'gpt-4',
      connectorId: 'conn-123',
    });
  });

  it('calculates estimated cost', async () => {
    const result = await evaluate({
      input: {},
      output: {
        modelUsage: {
          input_tokens: 1000,
          output_tokens: 1000,
        },
      },
      expected: undefined,
      metadata: null,
    });
    // 1000/1000 * 0.003 + 1000/1000 * 0.015 = 0.003 + 0.015 = 0.018
    expect(result.metadata).toMatchObject({
      estimatedCostUsd: 0.018,
    });
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
