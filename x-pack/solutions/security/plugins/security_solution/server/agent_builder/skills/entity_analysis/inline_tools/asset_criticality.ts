/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { ToolResultType, ToolType } from '@kbn/agent-builder-common';
import type { ToolHandlerResult } from '@kbn/agent-builder-server';
import type { SkillBoundedTool } from '@kbn/agent-builder-server/skills';
import type { EntityType } from '../../../../../common/entity_analytics/types';
import { EntityTypeToIdentifierField } from '../../../../../common/entity_analytics/types';
import { getAssetCriticalityIndex } from '../../../../../common/entity_analytics/asset_criticality';
import type { EntityAnalysisSkillsContext } from '../entity_analysis_skill';
import { entityAnalyticsInlineToolSchema, getDependencies } from './common';

export const getAssetCriticalityInlineTool = (
  ctx: EntityAnalysisSkillsContext
): SkillBoundedTool => ({
  id: 'security.entity_analysis.asset_criticality',
  type: ToolType.builtin,
  schema: entityAnalyticsInlineToolSchema,
  description: `Allows you to classify your organisation's entities based on various operational factors that are important to your organisation.`,
  handler: async ({ entityType, prompt, queryExtraContext }, context) => {
    try {
      const { esClient, request, toolProvider } = context;
      const results: ToolHandlerResult[] = [];

      const { generalSecuritySolutionMessage, generateESQLTool, spaceId } = await getDependencies(
        entityType,
        esClient,
        ctx.getStartServices,
        request,
        toolProvider
      );
      const assetCriticalityIndexPattern = getAssetCriticalityIndex(spaceId);
      const message = `
      This is a set of rules that you must follow strictly:
      * When searching asset criticality for '${entityType}' you **MUST ALWAYS** filter by: 'where id_field == "${
        EntityTypeToIdentifierField[entityType as EntityType]
      }"'.
      * The criticality value is stored in the field 'criticality_level'.`;

      if (generateESQLTool) {
        const { results: generateESQLResult } = await generateESQLTool.execute({
          toolParams: {
            index: assetCriticalityIndexPattern,
            query: prompt,
            context: `${message}\n${generalSecuritySolutionMessage}\n${queryExtraContext ?? ''}`,
          },
        });
        if (generateESQLResult) {
          results.push(...generateESQLResult);
        }
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
