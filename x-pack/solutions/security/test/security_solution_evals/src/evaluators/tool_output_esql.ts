/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { Evaluator, TaskOutput } from '@kbn/evals';
import { getStringMeta, getToolCallStepsWithParams } from '@kbn/evals-suite-agent-builder';
import { extractEsqlQueries, normalizeWhitespace, matchClause } from './helpers';

/**
 * Evaluator that checks whether the agent produced the expected ES|QL query.
 *
 * The expected query (from metadata `expectedEsql`) is split into pipe-separated
 * clauses. The evaluator scores based on the proportion of expected clauses that
 * appear in the best-matching actual query. Returns score 1 when no expectation
 * is set.
 */
export const createToolOutputEsqlEvaluator = (): Evaluator => ({
  name: 'ToolOutputESQL',
  kind: 'CODE' as const,
  evaluate: async ({ output, metadata }) => {
    const expectedEsql = getStringMeta(metadata, 'expectedEsql');
    if (!expectedEsql) return { score: 1 };

    const taskOutput = output as TaskOutput;
    const toolCalls = getToolCallStepsWithParams(taskOutput);
    const allEsqlQueries = extractEsqlQueries(taskOutput, toolCalls);

    if (allEsqlQueries.length === 0) {
      return {
        score: 0,
        metadata: { reason: 'No ESQL queries found in tool results or response', expectedEsql },
      };
    }

    const normalizedExpected = normalizeWhitespace(expectedEsql);
    const expectedClauses = normalizedExpected
      .split('|')
      .map((c) => c.trim())
      .filter(Boolean);

    const matchResults = allEsqlQueries.map((actual) => {
      const normalizedActual = normalizeWhitespace(actual);
      const clauseMatches = expectedClauses.map((clause) => ({
        clause,
        found: matchClause(clause, normalizedActual),
      }));
      const matchedCount = clauseMatches.filter((c) => c.found).length;
      return { actual, clauseMatches, matchedCount, total: expectedClauses.length };
    });

    const bestMatch = matchResults.reduce((best, current) =>
      current.matchedCount > best.matchedCount ? current : best
    );

    const score = bestMatch.total > 0 ? bestMatch.matchedCount / bestMatch.total : 0;

    return {
      score,
      metadata: {
        expectedEsql,
        actualEsqlQueries: allEsqlQueries,
        bestMatchScore: `${bestMatch.matchedCount}/${bestMatch.total}`,
        missedClauses: bestMatch.clauseMatches
          .filter((c) => !c.found)
          .map((c) => c.clause),
      },
    };
  },
});
