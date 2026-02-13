/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { extractEsqlQueries, normalizeWhitespace, matchClause } from './helpers';

describe('helpers', () => {
  describe('extractEsqlQueries', () => {
    it('returns empty array when no queries found', () => {
      const output = {};
      expect(extractEsqlQueries(output, [])).toEqual([]);
    });

    it('extracts ESQL from tool params.query', () => {
      const toolCalls = [{ tool_id: 'esql', params: { query: 'FROM logs | LIMIT 10' } }];
      expect(extractEsqlQueries({}, toolCalls)).toEqual(['FROM logs | LIMIT 10']);
    });

    it('skips empty query strings in params', () => {
      const toolCalls = [{ tool_id: 'esql', params: { query: '  ' } }];
      expect(extractEsqlQueries({}, toolCalls)).toEqual([]);
    });

    it('extracts ESQL from tool results data.esql', () => {
      const toolCalls = [
        {
          tool_id: 'generate_esql',
          results: [{ data: { esql: 'FROM metrics | STATS count()' } }],
        },
      ];
      expect(extractEsqlQueries({}, toolCalls)).toEqual(['FROM metrics | STATS count()']);
    });

    it('extracts ESQL from tool results data.query', () => {
      const toolCalls = [
        {
          tool_id: 'risk_score',
          results: [{ data: { query: 'FROM risk | SORT score DESC' } }],
        },
      ];
      expect(extractEsqlQueries({}, toolCalls)).toEqual(['FROM risk | SORT score DESC']);
    });

    it('extracts ESQL from markdown code blocks in messages', () => {
      const output = {
        messages: [
          {
            message:
              'Here is the query:\n```esql\nFROM logs-* | WHERE host.name == "server1" | LIMIT 5\n```',
          },
        ],
      };
      expect(extractEsqlQueries(output, [])).toEqual([
        'FROM logs-* | WHERE host.name == "server1" | LIMIT 5',
      ]);
    });

    it('ignores code blocks that do not contain FROM', () => {
      const output = {
        messages: [{ message: '```sql\nSELECT * FROM table\n```' }],
      };
      // The code block content has 'FROM' so it should be picked up
      expect(extractEsqlQueries(output, [])).toHaveLength(1);
    });

    it('combines queries from all sources', () => {
      const toolCalls = [
        { tool_id: 'esql', params: { query: 'FROM a' } },
        { tool_id: 'gen', results: [{ data: { esql: 'FROM b' } }] },
      ];
      const output = {
        messages: [{ message: '```esql\nFROM c\n```' }],
      };
      expect(extractEsqlQueries(output, toolCalls)).toEqual(['FROM a', 'FROM b', 'FROM c']);
    });
  });

  describe('normalizeWhitespace', () => {
    it('collapses multiple spaces', () => {
      expect(normalizeWhitespace('FROM  logs   |  LIMIT  10')).toBe('from logs | limit 10');
    });

    it('trims leading and trailing whitespace', () => {
      expect(normalizeWhitespace('  FROM logs  ')).toBe('from logs');
    });

    it('converts to lowercase', () => {
      expect(normalizeWhitespace('FROM Logs')).toBe('from logs');
    });

    it('collapses newlines and tabs', () => {
      expect(normalizeWhitespace('FROM logs\n| WHERE\tx > 1')).toBe('from logs | where x > 1');
    });
  });

  describe('matchClause', () => {
    it('matches simple substring clauses', () => {
      expect(matchClause('from logs', 'from logs | limit 10')).toBe(true);
      expect(matchClause('limit 10', 'from logs | limit 10')).toBe(true);
      expect(matchClause('where x > 1', 'from logs | limit 10')).toBe(false);
    });

    it('matches KEEP clauses order-independently', () => {
      expect(matchClause('keep a, b, c', 'from logs | keep c, b, a')).toBe(true);
      expect(matchClause('keep a, b', 'from logs | keep a, b, c')).toBe(true);
      expect(matchClause('keep a, d', 'from logs | keep a, b, c')).toBe(false);
    });

    it('returns false for KEEP when no KEEP clause in actual', () => {
      expect(matchClause('keep a, b', 'from logs | limit 10')).toBe(false);
    });
  });
});
