/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { resolveModelPricing, calculateCost } from './model_pricing';

describe('model_pricing', () => {
  describe('resolveModelPricing', () => {
    it('resolves exact canonical model names', () => {
      const gpt41 = resolveModelPricing('gpt-4.1');
      expect(gpt41).toBeDefined();
      expect(gpt41!.inputCostPerToken).toBe(2e-6);
      expect(gpt41!.outputCostPerToken).toBe(8e-6);
    });

    it('resolves Anthropic models', () => {
      const sonnet = resolveModelPricing('claude-sonnet-4.5');
      expect(sonnet).toBeDefined();
      expect(sonnet!.inputCostPerToken).toBe(3e-6);
      expect(sonnet!.outputCostPerToken).toBe(1.5e-5);
    });

    it('resolves Gemini models', () => {
      const gemini = resolveModelPricing('gemini-2.5-pro');
      expect(gemini).toBeDefined();
      expect(gemini!.inputCostPerToken).toBe(1.25e-6);
      expect(gemini!.outputCostPerToken).toBe(1e-5);
    });

    it('resolves dated snapshot aliases', () => {
      expect(resolveModelPricing('gpt-4.1-2025-04-14')).toEqual(
        resolveModelPricing('gpt-4.1')
      );
      expect(resolveModelPricing('claude-sonnet-4-5-20250929')).toEqual(
        resolveModelPricing('claude-sonnet-4.5')
      );
      expect(resolveModelPricing('claude-3-5-sonnet-20241022')).toEqual(
        resolveModelPricing('claude-3.5-sonnet')
      );
    });

    it('resolves short-hand aliases', () => {
      expect(resolveModelPricing('gpt41')).toEqual(resolveModelPricing('gpt-4.1'));
      expect(resolveModelPricing('sonnet45')).toEqual(
        resolveModelPricing('claude-sonnet-4.5')
      );
      expect(resolveModelPricing('gemini25pro')).toEqual(
        resolveModelPricing('gemini-2.5-pro')
      );
    });

    it('is case-insensitive', () => {
      expect(resolveModelPricing('GPT-4.1')).toEqual(resolveModelPricing('gpt-4.1'));
      expect(resolveModelPricing('Claude-Sonnet-4.5')).toEqual(
        resolveModelPricing('claude-sonnet-4.5')
      );
    });

    it('uses prefix matching for versioned model strings', () => {
      // A model string like "gpt-4.1-some-future-suffix" should match "gpt-4.1"
      const result = resolveModelPricing('gpt-4.1-some-future-suffix');
      expect(result).toEqual(resolveModelPricing('gpt-4.1'));
    });

    it('returns undefined for completely unknown models', () => {
      expect(resolveModelPricing('totally-unknown-model-xyz')).toBeUndefined();
    });

    it('trims whitespace', () => {
      expect(resolveModelPricing('  gpt-4.1  ')).toEqual(resolveModelPricing('gpt-4.1'));
    });

    it('resolves all major model families', () => {
      // Ensure key models used in evaluations are present
      const models = [
        'gpt-4.1',
        'gpt-4o',
        'gpt-4o-mini',
        'claude-opus-4',
        'claude-sonnet-4',
        'claude-sonnet-4.5',
        'claude-3.5-sonnet',
        'gemini-2.5-pro',
        'gemini-2.5-flash',
      ];
      for (const model of models) {
        const pricing = resolveModelPricing(model);
        expect(pricing).toBeDefined();
        expect(pricing!.inputCostPerToken).toBeGreaterThan(0);
        expect(pricing!.outputCostPerToken).toBeGreaterThan(0);
      }
    });
  });

  describe('calculateCost', () => {
    it('calculates cost correctly', () => {
      const pricing = { inputCostPerToken: 2e-6, outputCostPerToken: 8e-6 };
      // 1000 input + 500 output = 1000 * 2e-6 + 500 * 8e-6 = 0.002 + 0.004 = 0.006
      expect(calculateCost(1000, 500, pricing)).toBeCloseTo(0.006);
    });

    it('returns 0 for zero tokens', () => {
      const pricing = { inputCostPerToken: 2e-6, outputCostPerToken: 8e-6 };
      expect(calculateCost(0, 0, pricing)).toBe(0);
    });

    it('handles input-only cost', () => {
      const pricing = { inputCostPerToken: 3e-6, outputCostPerToken: 1.5e-5 };
      expect(calculateCost(1_000_000, 0, pricing)).toBeCloseTo(3.0);
    });
  });
});
