/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { TaskOutput } from '@kbn/evals';
import type { ToolCallStep } from '@kbn/evals-suite-agent-builder';

/**
 * Collect ES|QL queries from tool-call parameters, results, and agent text response.
 */
export const extractEsqlQueries = (
  taskOutput: TaskOutput,
  toolCalls: ToolCallStep[]
): string[] => {
  const queries: string[] = [];

  for (const tc of toolCalls) {
    // Extract from tool params (e.g. execute_esql receives ESQL as params.query)
    const params = tc.params as Record<string, unknown> | undefined;
    if (typeof params?.query === 'string' && params.query.trim().length > 0) {
      queries.push(params.query);
    }

    // Extract from tool results (generate_esql, execute_esql, risk_score inline tool)
    if (!tc.results) continue;
    for (const result of tc.results as Array<{
      type?: string;
      data?: { esql?: string; query?: string; source?: string };
    }>) {
      const esql = result?.data?.esql ?? result?.data?.query;
      if (typeof esql === 'string' && esql.trim().length > 0) {
        queries.push(esql);
      }
    }
  }

  // Fallback: extract ESQL from agent text response (markdown code blocks)
  const messages = (taskOutput as { messages?: Array<{ message?: string }> }).messages;
  if (messages) {
    for (const msg of messages) {
      if (!msg?.message) continue;
      const codeBlocks = msg.message.match(/```(?:esql|sql)?\s*\n([\s\S]*?)```/gi) ?? [];
      for (const block of codeBlocks) {
        const content = block
          .replace(/```(?:esql|sql)?\s*\n?/i, '')
          .replace(/```$/, '')
          .trim();
        if (content.toLowerCase().includes('from ')) {
          queries.push(content);
        }
      }
    }
  }

  return queries;
};

/** Collapse all runs of whitespace to a single space, trim, and lower-case. */
export const normalizeWhitespace = (s: string): string =>
  s.replace(/\s+/g, ' ').trim().toLowerCase();

/**
 * Clause-type-aware matching: KEEP clauses use order-independent field
 * matching; all other clause types use substring matching.
 */
export const matchClause = (clause: string, normalizedActual: string): boolean => {
  const keyword = clause.split(/\s/)[0];

  if (keyword === 'keep') {
    const expectedFields = clause
      .replace(/^keep\s+/, '')
      .split(',')
      .map((f) => f.trim())
      .filter(Boolean);

    const keepMatch = normalizedActual.match(/\bkeep\s+([^|]+)/);
    if (!keepMatch) return false;

    const actualFields = keepMatch[1]
      .split(',')
      .map((f) => f.trim())
      .filter(Boolean);

    return expectedFields.every((ef) => actualFields.includes(ef));
  }

  // Default: substring match (works well for FROM, WHERE, SORT, LIMIT)
  return normalizedActual.includes(clause);
};
