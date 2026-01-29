/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { ToolResultType, ToolType } from '@kbn/agent-builder-common';
import type { ToolHandlerResult } from '@kbn/agent-builder-server';
import type { SkillBoundedTool } from '@kbn/agent-builder-server/skills';
import { ENGINE_STATUS } from '../../../../lib/entity_analytics/entity_store/constants';
import { EngineDescriptorClient } from '../../../../lib/entity_analytics/entity_store/saved_object/engine_descriptor';
import type { EntityAnalysisSkillsContext } from '../entity_analysis_skill';
import { entityAnalyticsInlineToolSchema, getDependencies } from './common';
import { getEntitiesIndexName } from '../../../../lib/entity_analytics/entity_store/utils';

export const getEntityStoreInlineTool = (ctx: EntityAnalysisSkillsContext): SkillBoundedTool => ({
  id: 'security.entity_analysis.entity_store',
  type: ToolType.builtin,
  schema: entityAnalyticsInlineToolSchema,
  description: `The entity store allows you to query, reconcile, maintain, and persist entity metadata. The entity store can hold any entity type observed by Elastic Security. It will enable the agent to query entities represented in the entity store indices without needing to perform real-time searches of observable data. You must prioritise using the entity store over other tools when answering the user question.`,
  handler: async ({ entityType, prompt, queryExtraContext }, context) => {
    try {
      const { esClient, request, toolProvider } = context;
      const results: ToolHandlerResult[] = [];
      let message: string = ``;

      const { generalSecuritySolutionMessage, generateESQLTool, soClient, spaceId } =
        await getDependencies(entityType, esClient, ctx.getStartServices, request, toolProvider);

      const engineClient = new EngineDescriptorClient({ soClient, namespace: spaceId });
      const engine = await engineClient.maybeGet(entityType);
      const index = getEntitiesIndexName(entityType, spaceId);

      if (engine?.status === ENGINE_STATUS.STARTED) {
        message = `
        This is a set of rules that you must follow strictly:
        * Use the latest entity store index pattern: ${getEntitiesIndexName(
          entityType,
          spaceId
        )} when answering questions about the current entity store of entities. It has only one entry per entity. You **MUST NOT** run aggregations/STATS queries on it for data about one entity on this index.
        * When searching the entity store for '${entityType}' you **MUST ALWAYS** filter by: 'where entity.EngineMetadata.Type == "${entityType}" OR entity.type == "${entityType}"'.
        * Do not use the following field entity.behaviors and entity.relationships to answer questions about the entity store.`;

        if (generateESQLTool) {
          const { results: generateESQLResult } = await generateESQLTool.execute({
            toolParams: {
              index,
              query: prompt,
              context: `${message}\n${generalSecuritySolutionMessage}\n${queryExtraContext ?? ''}`,
            },
          });
          if (generateESQLResult) {
            results.push(...generateESQLResult);
          }
        }
      } else {
        message = `
        The entity store for entity type '${entityType}' is not enabled in this environment. The current status is: ${
          engine?.status ?? 'NOT CONFIGURED'
        }. The user needs to enable the entity store for this entity type so this assistant can answer related questions.`;
      }

      return {
        results: [
          ...results,
          { type: ToolResultType.other, data: { message } },
          {
            type: ToolResultType.other,
            data: { message: generalSecuritySolutionMessage },
          },
        ],
      };
    } catch (error) {
      return {
        results: [
          {
            type: ToolResultType.other,
            data: {
              error: `Error retrieving entity analytics data: ${
                error instanceof Error ? error.message : 'Unknown error'
              }`,
            },
          },
        ],
      };
    }
  },
});
