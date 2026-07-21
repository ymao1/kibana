/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import WATCH_DARK_YAML from './watch_dark.yaml';
import WATCH_DEEP_YAML from './watch_deep.yaml';
import WATCH_FLOOR_YAML from './watch_floor.yaml';
import WATCH_OFFICER_YAML from './watch_officer.yaml';
import type { ManagedWorkflowDefinition, ManagedWorkflowTemplateValues } from '../../types';

// ── IDs ────────────────────────────────────────────────────────────────────

export const PND_WATCH_FLOOR_WORKFLOW_ID = 'system-security-watch-floor';
export const PND_WATCH_OFFICER_WORKFLOW_ID = 'system-security-watch-officer';
export const PND_WATCH_DARK_WORKFLOW_ID = 'system-security-watch-dark';
export const PND_WATCH_DEEP_WORKFLOW_ID = 'system-security-watch-deep';

export const PND_WATCH_WORKFLOW_IDS = [
  PND_WATCH_FLOOR_WORKFLOW_ID,
  PND_WATCH_OFFICER_WORKFLOW_ID,
  PND_WATCH_DARK_WORKFLOW_ID,
  PND_WATCH_DEEP_WORKFLOW_ID,
] as const;

// ── Callable definitions ───────────────────────────────────────────────────

export interface WatchCallable<TKind extends string = string> {
  id: string;
  name: string;
  kind: TKind;
  summary: string;
  gated: boolean;
  enabled: boolean;
}

/**
 * A skill callable exposed by a watch — used both to generate the workflow
 * YAML `callables` block and to populate the watch agent's `skill_ids`.
 */
export type WatchSkillCallable = WatchCallable<'skill'>;

/**
 * A workflow callable exposed by a watch
 */
export type WatchWorkflowCallable = WatchCallable<'workflow'>;

// ── Per-watch metadata ─────────────────────────────────────────────────────

type CallableInput<TKind extends string> = Omit<WatchCallable<TKind>, 'kind'>;

export interface WatchMetadata {
  name: string;
  description: string;
  tags: string[];
  skills: Array<CallableInput<'skill'>>;
  workflows: Array<CallableInput<'workflow'>>;
}

export const PND_WATCH_FLOOR_METADATA: WatchMetadata = {
  name: 'Watch Floor',
  description:
    'Tier-1 Security Watch Floor. Triages alerts via the alert-analysis skill. Full Alert Analysis managed-workflow wrap (workflow.execute) is the next Floor spike.',
  tags: ['watch', 'watch-floor'],
  skills: [
    {
      id: 'alert-analysis',
      name: 'Alert analysis',
      summary: 'On alert · classifies FP / TP / inconclusive',
      gated: false,
      enabled: true,
    },
  ],
  workflows: [],
};

export const PND_WATCH_OFFICER_METADATA: WatchMetadata = {
  name: 'Watch Officer',
  description:
    'Tier-2 Security Watch Officer. Escalates criticals, drafts briefs, and stages gated response proposals for human approval.',
  tags: ['watch', 'watch-officer'],
  skills: [],
  workflows: [],
};

export const PND_WATCH_DARK_METADATA: WatchMetadata = {
  name: 'Dark Watch',
  description:
    'Dark Watch. Overnight continuous hunt-style sweeps with allow-listed autonomous actions.',
  tags: ['watch', 'watch-dark'],
  skills: [],
  workflows: [],
};

export const PND_WATCH_DEEP_METADATA: WatchMetadata = {
  name: 'Deep Watch',
  description:
    'Deep Watch. Specialist on-demand depth — forensics, hunts, and draft-only conclusions under human review.',
  tags: ['watch', 'watch-deep'],
  skills: [],
  workflows: [],
};

export const PND_WATCH_METADATA: Record<(typeof PND_WATCH_WORKFLOW_IDS)[number], WatchMetadata> = {
  [PND_WATCH_FLOOR_WORKFLOW_ID]: PND_WATCH_FLOOR_METADATA,
  [PND_WATCH_OFFICER_WORKFLOW_ID]: PND_WATCH_OFFICER_METADATA,
  [PND_WATCH_DARK_WORKFLOW_ID]: PND_WATCH_DARK_METADATA,
  [PND_WATCH_DEEP_WORKFLOW_ID]: PND_WATCH_DEEP_METADATA,
};

// ── Template values ────────────────────────────────────────────────────────

export interface WatchWorkflowTemplateValues extends ManagedWorkflowTemplateValues {
  name: string;
  description: string;
  tags: string;
  callables: string;
}

export const PND_WATCH_TEMPLATE_VALUES: Record<
  (typeof PND_WATCH_WORKFLOW_IDS)[number],
  WatchWorkflowTemplateValues
> = {
  [PND_WATCH_FLOOR_WORKFLOW_ID]: toTemplateValues(PND_WATCH_FLOOR_METADATA),
  [PND_WATCH_OFFICER_WORKFLOW_ID]: toTemplateValues(PND_WATCH_OFFICER_METADATA),
  [PND_WATCH_DARK_WORKFLOW_ID]: toTemplateValues(PND_WATCH_DARK_METADATA),
  [PND_WATCH_DEEP_WORKFLOW_ID]: toTemplateValues(PND_WATCH_DEEP_METADATA),
};

// ── Workflow definitions ───────────────────────────────────────────────────

const MANAGEMENT = {
  enablement: 'restorable',
  lifecycle: 'static',
  versionStrategy: 'auto',
} as const;

const PLUGIN_ID = 'pnd';

const VISIBILITY = {
  selectors: ['watch'],
  solutions: ['security'],
} as const;

export const PND_WATCH_FLOOR_WORKFLOW = {
  billable: false,
  id: PND_WATCH_FLOOR_WORKFLOW_ID,
  management: MANAGEMENT,
  pluginId: PLUGIN_ID,
  version: 4,
  visibility: VISIBILITY,
  yamlTemplate: ({ name, description, tags, callables }: WatchWorkflowTemplateValues) =>
    renderTemplate(WATCH_FLOOR_YAML, {
      __WATCH_NAME__: name,
      __WATCH_DESCRIPTION__: description,
      __WATCH_TAGS__: tags,
      __WATCH_CALLABLES__: callables,
    }),
} as const satisfies ManagedWorkflowDefinition<WatchWorkflowTemplateValues>;

export const PND_WATCH_OFFICER_WORKFLOW = {
  billable: false,
  id: PND_WATCH_OFFICER_WORKFLOW_ID,
  management: MANAGEMENT,
  pluginId: PLUGIN_ID,
  version: 4,
  visibility: VISIBILITY,
  yamlTemplate: ({ name, description, callables }: WatchWorkflowTemplateValues) =>
    renderTemplate(WATCH_OFFICER_YAML, {
      __WATCH_NAME__: name,
      __WATCH_DESCRIPTION__: description,
      __WATCH_TAGS__: tags,
      __WATCH_CALLABLES__: callables,
    }),
} as const satisfies ManagedWorkflowDefinition<WatchWorkflowTemplateValues>;

export const PND_WATCH_DARK_WORKFLOW = {
  billable: false,
  id: PND_WATCH_DARK_WORKFLOW_ID,
  management: MANAGEMENT,
  pluginId: PLUGIN_ID,
  version: 4,
  visibility: VISIBILITY,
  yamlTemplate: ({ name, description, callables }: WatchWorkflowTemplateValues) =>
    renderTemplate(WATCH_DARK_YAML, {
      __WATCH_NAME__: name,
      __WATCH_DESCRIPTION__: description,
      __WATCH_TAGS__: tags,
      __WATCH_CALLABLES__: callables,
    }),
} as const satisfies ManagedWorkflowDefinition<WatchWorkflowTemplateValues>;

export const PND_WATCH_DEEP_WORKFLOW = {
  billable: false,
  id: PND_WATCH_DEEP_WORKFLOW_ID,
  management: MANAGEMENT,
  pluginId: PLUGIN_ID,
  version: 4,
  visibility: VISIBILITY,
  yamlTemplate: ({ name, description, callables }: WatchWorkflowTemplateValues) =>
    renderTemplate(WATCH_DEEP_YAML, {
      __WATCH_NAME__: name,
      __WATCH_DESCRIPTION__: description,
      __WATCH_TAGS__: tags,
      __WATCH_CALLABLES__: callables,
    }),
} as const satisfies ManagedWorkflowDefinition<WatchWorkflowTemplateValues>;

export const PND_WATCH_WORKFLOWS = [
  PND_WATCH_FLOOR_WORKFLOW,
  PND_WATCH_OFFICER_WORKFLOW,
  PND_WATCH_DARK_WORKFLOW,
  PND_WATCH_DEEP_WORKFLOW,
] as const;

// ── Helpers ────────────────────────────────────────────────────────────────

function renderCallablesYaml(skills: WatchCallable[]): string {
  if (skills.length === 0) return 'callables: []';
  const lines = skills.flatMap((s) => [
    `          - id: ${s.id}`,
    `            name: ${s.name}`,
    `            kind: ${s.kind}`,
    `            summary: ${s.summary}`,
    `            gated: ${s.gated}`,
    `            enabled: ${s.enabled}`,
  ]);
  return `callables:\n${lines.join('\n')}`;
}

function toTemplateValues(meta: WatchMetadata): WatchWorkflowTemplateValues {
  return {
    name: meta.name,
    description: meta.description,
    tags: meta.tags.map((t) => `  - ${t}`).join('\n'),
    callables: renderCallablesYaml([
      ...meta.skills.map((s) => ({ ...s, kind: 'skill' as const })),
      ...meta.workflows.map((w) => ({ ...w, kind: 'workflow' as const })),
    ]),
  };
}

// yamlTemplate values are substituted into the YAML files via exact-token
// replacement. Values (name, description, callables) are needed at
// workflow-install time and are derived from WatchMetadata constants above.
function renderTemplate(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce(
    (yaml, [token, value]) => yaml.split(token).join(value),
    template
  );
}
