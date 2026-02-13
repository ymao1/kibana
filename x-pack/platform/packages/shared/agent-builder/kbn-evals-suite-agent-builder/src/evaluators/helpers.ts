/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

// NOTE: All imports from @kbn/evals MUST be type-only to avoid pulling in the
// full barrel which includes ESM-only transitive deps that break Jest.
import type { TaskOutput } from '@kbn/evals';

/**
 * Extract a string value from example metadata by key.
 * Re-implemented locally to avoid pulling in the full @kbn/evals barrel
 * (which has ESM-only transitive deps that break Jest).
 */
export const getStringMeta = (
  metadata: Record<string, unknown> | null | undefined,
  key: string
): string | undefined => {
  const value = metadata?.[key];
  return typeof value === 'string' ? value : undefined;
};

export interface ToolCallStep {
  tool_id?: string;
  params?: Record<string, unknown>;
  results?: unknown[];
}

/** Auxiliary tools used for skill discovery — ignored by ToolUsageOnly evaluator */
export const AUXILIARY_DISCOVERY_TOOLS = new Set([
  'grep',
  'read_file',
  'read_skill_tools',
  'list_skills',
  'filestore.read',
]);

/**
 * Extract tool-call steps together with their parameters from raw task output.
 */
export const getToolCallStepsWithParams = (taskOutput: TaskOutput): ToolCallStep[] => {
  const rawOutput = taskOutput as {
    steps?: Array<{
      type?: string;
      tool_id?: string;
      tool_params?: Record<string, unknown>;
      params?: Record<string, unknown>;
      results?: unknown[];
    }>;
  };

  return (rawOutput?.steps ?? [])
    .filter((s) => s?.type === 'tool_call')
    .map((s) => ({
      tool_id: s.tool_id,
      params: s.tool_params ?? s.params,
      results: s.results,
    }));
};
