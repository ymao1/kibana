/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { createToolOutputEsqlEvaluator } from './tool_output_esql';

const evaluate = createToolOutputEsqlEvaluator().evaluate;

describe('ToolOutputESQL evaluator', () => {
  it('returns score 1 when no expectedEsql is set', async () => {
    const result = await evaluate({
      input: {},
      output: {},
      expected: undefined,
      metadata: null,
    });
    expect(result.score).toBe(1);
  });

  it('returns score 0 when no ESQL queries are found', async () => {
    const result = await evaluate({
      input: {},
      output: { steps: [] },
      expected: undefined,
      metadata: { expectedEsql: 'FROM logs | LIMIT 10' },
    });
    expect(result.score).toBe(0);
    expect(result.metadata).toMatchObject({
      reason: 'No ESQL queries found in tool results or response',
    });
  });

  it('returns score 1 when all clauses match exactly', async () => {
    const result = await evaluate({
      input: {},
      output: {
        steps: [
          {
            type: 'tool_call',
            tool_id: 'execute_esql',
            tool_params: { query: 'FROM logs | WHERE host == "server1" | LIMIT 10' },
          },
        ],
      },
      expected: undefined,
      metadata: { expectedEsql: 'FROM logs | WHERE host == "server1" | LIMIT 10' },
    });
    expect(result.score).toBe(1);
  });

  it('returns partial score when some clauses match', async () => {
    const result = await evaluate({
      input: {},
      output: {
        steps: [
          {
            type: 'tool_call',
            tool_id: 'execute_esql',
            tool_params: { query: 'FROM logs | LIMIT 10' },
          },
        ],
      },
      expected: undefined,
      metadata: {
        expectedEsql: 'FROM logs | WHERE host == "server1" | LIMIT 10',
      },
    });
    // 2 out of 3 clauses match (FROM logs, LIMIT 10), WHERE is missing
    expect(result.score).toBeCloseTo(2 / 3, 2);
    expect(result.metadata).toMatchObject({
      bestMatchScore: '2/3',
      missedClauses: expect.arrayContaining([expect.stringContaining('where')]),
    });
  });

  it('handles whitespace normalization', async () => {
    const result = await evaluate({
      input: {},
      output: {
        steps: [
          {
            type: 'tool_call',
            tool_id: 'execute_esql',
            tool_params: { query: 'FROM   logs\n|  LIMIT    10' },
          },
        ],
      },
      expected: undefined,
      metadata: { expectedEsql: 'FROM logs | LIMIT 10' },
    });
    expect(result.score).toBe(1);
  });

  it('handles case-insensitive matching', async () => {
    const result = await evaluate({
      input: {},
      output: {
        steps: [
          {
            type: 'tool_call',
            tool_id: 'execute_esql',
            tool_params: { query: 'from LOGS | limit 10' },
          },
        ],
      },
      expected: undefined,
      metadata: { expectedEsql: 'FROM logs | LIMIT 10' },
    });
    expect(result.score).toBe(1);
  });

  it('matches KEEP clauses order-independently', async () => {
    const result = await evaluate({
      input: {},
      output: {
        steps: [
          {
            type: 'tool_call',
            tool_id: 'execute_esql',
            tool_params: { query: 'FROM logs | KEEP host, timestamp, message' },
          },
        ],
      },
      expected: undefined,
      metadata: {
        expectedEsql: 'FROM logs | KEEP message, host, timestamp',
      },
    });
    expect(result.score).toBe(1);
  });

  it('scores KEEP correctly when some fields are missing', async () => {
    const result = await evaluate({
      input: {},
      output: {
        steps: [
          {
            type: 'tool_call',
            tool_id: 'execute_esql',
            tool_params: { query: 'FROM logs | KEEP host' },
          },
        ],
      },
      expected: undefined,
      metadata: {
        expectedEsql: 'FROM logs | KEEP host, timestamp',
      },
    });
    // FROM matches, KEEP does not (missing timestamp field)
    expect(result.score).toBe(0.5);
  });

  it('extracts ESQL from tool results data.esql', async () => {
    const result = await evaluate({
      input: {},
      output: {
        steps: [
          {
            type: 'tool_call',
            tool_id: 'generate_esql',
            results: [{ data: { esql: 'FROM metrics | STATS count()' } }],
          },
        ],
      },
      expected: undefined,
      metadata: { expectedEsql: 'FROM metrics | STATS count()' },
    });
    expect(result.score).toBe(1);
  });

  it('extracts ESQL from markdown code blocks in messages', async () => {
    const result = await evaluate({
      input: {},
      output: {
        steps: [],
        messages: [
          {
            message: 'Here is the query:\n```esql\nFROM logs | LIMIT 5\n```',
          },
        ],
      },
      expected: undefined,
      metadata: { expectedEsql: 'FROM logs | LIMIT 5' },
    });
    expect(result.score).toBe(1);
  });

  it('picks the best matching query when multiple are present', async () => {
    const result = await evaluate({
      input: {},
      output: {
        steps: [
          {
            type: 'tool_call',
            tool_id: 'execute_esql',
            tool_params: { query: 'FROM wrong_index | LIMIT 1' },
          },
          {
            type: 'tool_call',
            tool_id: 'execute_esql',
            tool_params: {
              query: 'FROM logs | WHERE host == "server1" | LIMIT 10',
            },
          },
        ],
      },
      expected: undefined,
      metadata: {
        expectedEsql: 'FROM logs | WHERE host == "server1" | LIMIT 10',
      },
    });
    expect(result.score).toBe(1);
  });

  it('includes actual queries and missed clauses in metadata', async () => {
    const result = await evaluate({
      input: {},
      output: {
        steps: [
          {
            type: 'tool_call',
            tool_id: 'execute_esql',
            tool_params: { query: 'FROM logs' },
          },
        ],
      },
      expected: undefined,
      metadata: { expectedEsql: 'FROM logs | WHERE x > 1 | SORT y' },
    });
    expect(result.metadata).toMatchObject({
      expectedEsql: 'FROM logs | WHERE x > 1 | SORT y',
      actualEsqlQueries: ['FROM logs'],
      bestMatchScore: '1/3',
      missedClauses: expect.arrayContaining([
        expect.stringContaining('where'),
        expect.stringContaining('sort'),
      ]),
    });
  });
});
