/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { getToolCallStepsWithParams, AUXILIARY_DISCOVERY_TOOLS } from './helpers';

describe('helpers', () => {
  describe('AUXILIARY_DISCOVERY_TOOLS', () => {
    it('contains the expected tool ids', () => {
      expect(AUXILIARY_DISCOVERY_TOOLS.has('grep')).toBe(true);
      expect(AUXILIARY_DISCOVERY_TOOLS.has('read_file')).toBe(true);
      expect(AUXILIARY_DISCOVERY_TOOLS.has('read_skill_tools')).toBe(true);
      expect(AUXILIARY_DISCOVERY_TOOLS.has('list_skills')).toBe(true);
      expect(AUXILIARY_DISCOVERY_TOOLS.has('filestore.read')).toBe(true);
      expect(AUXILIARY_DISCOVERY_TOOLS.has('platform.core.search')).toBe(false);
    });
  });

  describe('getToolCallStepsWithParams', () => {
    it('returns empty array when output has no steps', () => {
      expect(getToolCallStepsWithParams({})).toEqual([]);
      expect(getToolCallStepsWithParams({ steps: [] })).toEqual([]);
    });

    it('filters to only tool_call steps', () => {
      const output = {
        steps: [
          { type: 'tool_call', tool_id: 'search', tool_params: { q: 'test' } },
          { type: 'message', tool_id: 'ignored' },
          { type: 'tool_call', tool_id: 'esql', params: { query: 'FROM x' } },
        ],
      };

      const result = getToolCallStepsWithParams(output);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        tool_id: 'search',
        params: { q: 'test' },
        results: undefined,
      });
      expect(result[1]).toEqual({
        tool_id: 'esql',
        params: { query: 'FROM x' },
        results: undefined,
      });
    });

    it('prefers tool_params over params', () => {
      const output = {
        steps: [
          {
            type: 'tool_call',
            tool_id: 'x',
            tool_params: { a: 1 },
            params: { b: 2 },
          },
        ],
      };

      expect(getToolCallStepsWithParams(output)[0].params).toEqual({ a: 1 });
    });

    it('falls back to params when tool_params is absent', () => {
      const output = {
        steps: [{ type: 'tool_call', tool_id: 'x', params: { b: 2 } }],
      };

      expect(getToolCallStepsWithParams(output)[0].params).toEqual({ b: 2 });
    });

    it('includes results when present', () => {
      const results = [{ data: { esql: 'FROM x' } }];
      const output = {
        steps: [{ type: 'tool_call', tool_id: 'x', results }],
      };

      expect(getToolCallStepsWithParams(output)[0].results).toBe(results);
    });
  });
});
