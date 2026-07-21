/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { DEFAULT_SPACE_ID } from '@kbn/core-spaces-common';
import { AgentAccessControlMode } from '@kbn/agent-builder-common';
import type { AgentBuilderPluginStart } from '@kbn/agent-builder-server';
import type { Logger } from '@kbn/logging';
import { PND_WATCH_WORKFLOW_IDS, PND_WATCH_METADATA } from '@kbn/workflows/managed';

export const installWatchAgents = async ({
  agentBuilder,
  enabled,
  logger,
}: {
  agentBuilder: AgentBuilderPluginStart;
  enabled: boolean;
  logger: Logger;
}): Promise<void> => {
  if (!enabled) return;

  for (const id of PND_WATCH_WORKFLOW_IDS) {
    const { name, description, tags, skills } = PND_WATCH_METADATA[id];
    try {
      await agentBuilder.agents.ensure({
        spaceId: DEFAULT_SPACE_ID,
        agent: {
          id,
          name,
          description,
          labels: ['security', ...tags],
          access_control: { access_mode: AgentAccessControlMode.Public },
          configuration: {
            tools: [],
            skill_ids: skills.map((s) => s.id),
          },
        },
      });
    } catch (error) {
      logger.error(
        `Failed to install watch agent "${id}": ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
};
