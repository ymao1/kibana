/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { ToolResultType, ToolType } from '@kbn/agent-builder-common';
import type { ToolHandlerResult } from '@kbn/agent-builder-server';
import type { SkillBoundedTool } from '@kbn/agent-builder-server/skills';
import { EntityTypeToIdentifierField } from '../../../../../common/entity_analytics/types';
import {
  EntityTypeToLevelField,
  EntityTypeToScoreField,
} from '../../../../../common/search_strategy';
import {
  getRiskScoreLatestIndex,
  getRiskScoreTimeSeriesIndex,
} from '../../../../../common/entity_analytics/risk_engine';
import type { EntityType } from '../../../../../common/api/entity_analytics';
import type { EntityAnalysisSkillsContext } from '../entity_analysis_skill';
import { entityAnalyticsInlineToolSchema, getDependencies } from './common';
import { RiskEngineDataClient } from '../../../../lib/entity_analytics/risk_engine/risk_engine_data_client';

export const getRiskScoreInlineTool = (ctx: EntityAnalysisSkillsContext): SkillBoundedTool => ({
  id: 'security.entity_analysis.risk_score',
  type: ToolType.builtin,
  schema: entityAnalyticsInlineToolSchema,
  description: `Entity risk scoring is an advanced Elastic Security analytics feature that helps security analysts detect changes in an entity's risk posture, hunt for new threats, and prioritise incident response`,
  handler: async ({ entityType, prompt, queryExtraContext }, context) => {
    try {
      const { esClient, logger, request, toolProvider } = context;
      const results: ToolHandlerResult[] = [];
      let message: string = ``;

      const { generalSecuritySolutionMessage, generateESQLTool, soClient, spaceId } =
        await getDependencies(entityType, esClient, ctx.getStartServices, request, toolProvider);

      const riskScoreIndexPattern = getRiskScoreLatestIndex(spaceId);
      const riskScoreTimeSeriesIndexPattern = getRiskScoreTimeSeriesIndex(spaceId);

      const riskEngineClient = new RiskEngineDataClient({
        logger,
        kibanaVersion: ctx.kibanaVersion,
        esClient: esClient.asCurrentUser,
        soClient,
        namespace: spaceId,
        auditLogger: undefined,
      });

      const engineStatus = await riskEngineClient.getStatus({ namespace: spaceId });

      if (engineStatus.riskEngineStatus === 'ENABLED') {
        message = `
        This is a set of rules that you must follow strictly:
        * Use the latest risk score index pattern: ${riskScoreIndexPattern} when answering questions about the current risk score of entities.
        * Use the risk score time series patterns: ${riskScoreTimeSeriesIndexPattern} when answering questions about how the risk score changes over time.
        * When querying the risk score for a entity you must **ALWAYS** use the normalized field '${
          EntityTypeToScoreField[entityType as EntityType]
        }'.
        * The field '${
          EntityTypeToLevelField[entityType as EntityType]
        }' contains a textual description of the risk level.
        * The inputs field inside the risk score document contains the 10 highest-risk documents (sorted by 'kibana.alert.risk_score') that contributed to the risk score of an entity.
        * When searching the risk score of an entity of type '${entityType}', you must **ALWAYS** filter by: 'where ${
          EntityTypeToIdentifierField[entityType as EntityType]
        } IS NOT NULL'`;

        if (generateESQLTool) {
          const { results: generateESQLResult } = await generateESQLTool.execute({
            toolParams: {
              index: riskScoreIndexPattern,
              query: prompt,
              context: `${message}\n${generalSecuritySolutionMessage}\n${queryExtraContext ?? ''}`,
            },
          });
          if (generateESQLResult) {
            results.push(...generateESQLResult);
          }
        }
      } else {
        message = `The risk engine is not enabled in this environment. The current status is: ${engineStatus.riskEngineStatus}. The user needs to enable the risk engine so that this agent can answer risk-related questions.`;
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
