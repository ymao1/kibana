/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { createToolUsageOnlyEvaluator } from '.';

const evaluate = createToolUsageOnlyEvaluator().evaluate;

const makeOutput = (
  steps: Array<{ type: string; tool_id: string; tool_params?: Record<string, unknown> }>
) => ({ steps });

describe('ToolUsageOnly evaluator', () => {
  it('returns score 1 when no expectedOnlyToolId is set', async () => {
    const result = await evaluate({
      input: {},
      output: {},
      expected: undefined,
      metadata: null,
    });
    expect(result.score).toBe(1);
  });

  it('returns score 0 when no tool calls are made', async () => {
    const result = await evaluate({
      input: {},
      output: { steps: [] },
      expected: undefined,
      metadata: { expectedOnlyToolId: 'security.entity_analysis.risk_score' },
    });
    expect(result.score).toBe(0);
    expect(result.metadata).toMatchObject({ reason: 'No tool calls found' });
  });

  it('returns score 0 when only auxiliary discovery tools are used', async () => {
    const result = await evaluate({
      input: {},
      output: makeOutput([
        { type: 'tool_call', tool_id: 'grep' },
        { type: 'tool_call', tool_id: 'filestore.read' },
      ]),
      expected: undefined,
      metadata: { expectedOnlyToolId: 'security.entity_analysis.risk_score' },
    });
    expect(result.score).toBe(0);
    expect(result.metadata).toMatchObject({
      reason: 'Only auxiliary discovery tools found',
    });
  });

  it('returns score 1 when the expected tool is used directly', async () => {
    const result = await evaluate({
      input: {},
      output: makeOutput([
        { type: 'tool_call', tool_id: 'security.entity_analysis.risk_score' },
      ]),
      expected: undefined,
      metadata: { expectedOnlyToolId: 'security.entity_analysis.risk_score' },
    });
    expect(result.score).toBe(1);
    expect(result.metadata).toMatchObject({ hasExpectedDirect: true });
  });

  it('returns score 1 when the expected tool is used via invoke_skill with matching name', async () => {
    const result = await evaluate({
      input: {},
      output: makeOutput([
        {
          type: 'tool_call',
          tool_id: 'invoke_skill',
          tool_params: { name: 'security.entity_analysis.risk_score' },
        },
      ]),
      expected: undefined,
      metadata: { expectedOnlyToolId: 'security.entity_analysis.risk_score' },
    });
    expect(result.score).toBe(1);
    expect(result.metadata).toMatchObject({ hasExpectedViaInvokeSkill: true });
  });

  it('returns score 1 when invoke_skill name matches after .core. removal', async () => {
    const result = await evaluate({
      input: {},
      output: makeOutput([
        {
          type: 'tool_call',
          tool_id: 'invoke_skill',
          tool_params: { name: 'platform.search' },
        },
      ]),
      expected: undefined,
      metadata: { expectedOnlyToolId: 'platform.core.search' },
    });
    expect(result.score).toBe(1);
  });

  it('returns score 1 when invoke_skill name is platform.search with execute_esql operation', async () => {
    const result = await evaluate({
      input: {},
      output: makeOutput([
        {
          type: 'tool_call',
          tool_id: 'invoke_skill',
          tool_params: { name: 'platform.search', operation: 'execute_esql' },
        },
      ]),
      expected: undefined,
      metadata: { expectedOnlyToolId: 'platform.core.execute_esql' },
    });
    expect(result.score).toBe(1);
  });

  it('returns score 1 when acceptable alternative (platform.core.search) is used', async () => {
    const result = await evaluate({
      input: {},
      output: makeOutput([
        { type: 'tool_call', tool_id: 'platform.core.search' },
      ]),
      expected: undefined,
      metadata: { expectedOnlyToolId: 'security.entity_analysis.risk_score' },
    });
    expect(result.score).toBe(1);
    expect(result.metadata).toMatchObject({
      hasAcceptableAlternative: true,
      hasExpectedDirect: false,
      hasExpectedViaInvokeSkill: false,
    });
  });

  it('returns score 1 when acceptable alternative (platform.core.execute_esql) is used', async () => {
    const result = await evaluate({
      input: {},
      output: makeOutput([
        { type: 'tool_call', tool_id: 'platform.core.execute_esql' },
      ]),
      expected: undefined,
      metadata: { expectedOnlyToolId: 'security.entity_analysis.risk_score' },
    });
    expect(result.score).toBe(1);
    expect(result.metadata).toMatchObject({ hasAcceptableAlternative: true });
  });

  it('returns score 0 when an unrelated tool is used', async () => {
    const result = await evaluate({
      input: {},
      output: makeOutput([
        { type: 'tool_call', tool_id: 'some.other.tool' },
      ]),
      expected: undefined,
      metadata: { expectedOnlyToolId: 'security.entity_analysis.risk_score' },
    });
    expect(result.score).toBe(0);
    expect(result.metadata).toMatchObject({
      hasExpectedDirect: false,
      hasExpectedViaInvokeSkill: false,
      hasAcceptableAlternative: false,
    });
  });

  it('ignores auxiliary tools when determining meaningful calls', async () => {
    const result = await evaluate({
      input: {},
      output: makeOutput([
        { type: 'tool_call', tool_id: 'filestore.read' },
        { type: 'tool_call', tool_id: 'security.entity_analysis.risk_score' },
      ]),
      expected: undefined,
      metadata: { expectedOnlyToolId: 'security.entity_analysis.risk_score' },
    });
    expect(result.score).toBe(1);
  });

  it('returns invoke_skill call details in metadata', async () => {
    const result = await evaluate({
      input: {},
      output: makeOutput([
        {
          type: 'tool_call',
          tool_id: 'invoke_skill',
          tool_params: {
            name: 'security.entity_analysis.risk_score',
            operation: 'get_risk',
          },
        },
      ]),
      expected: undefined,
      metadata: { expectedOnlyToolId: 'security.entity_analysis.risk_score' },
    });
    expect(result.metadata).toMatchObject({
      invokeSkillCalls: [
        {
          name: 'security.entity_analysis.risk_score',
          operation: 'get_risk',
        },
      ],
    });
  });
});
