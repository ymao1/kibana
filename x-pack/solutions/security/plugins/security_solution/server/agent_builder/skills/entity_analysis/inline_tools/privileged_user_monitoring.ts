/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { ToolResultType, ToolType } from '@kbn/agent-builder-common';
import type { ToolHandlerResult } from '@kbn/agent-builder-server';
import type { SkillBoundedTool } from '@kbn/agent-builder-server/skills';
import { EntityTypeEnum } from '../../../../../common/api/entity_analytics';
import { PRIVILEGE_MONITORING_ENGINE_STATUS } from '../../../../lib/entity_analytics/privilege_monitoring/constants';
import { getPrivilegedMonitorUsersIndex } from '../../../../../common/entity_analytics/privileged_user_monitoring/utils';
import { PrivilegeMonitoringEngineDescriptorClient } from '../../../../lib/entity_analytics/privilege_monitoring/saved_objects';
import type { EntityAnalysisSkillsContext } from '../entity_analysis_skill';
import { entityAnalyticsInlineToolSchema, getDependencies } from './common';

export const getPrivilegedUserMonitoringInlineTool = (
  ctx: EntityAnalysisSkillsContext
): SkillBoundedTool => ({
  id: 'security.entity_analysis.privileged_user_monitoring',
  type: ToolType.builtin,
  schema: entityAnalyticsInlineToolSchema,
  description: `It is a list of all the users with elevated permissions (privileged), such as system administrators or users with access to sensitive data`,
  handler: async ({ entityType, prompt, queryExtraContext }, context) => {
    try {
      const { esClient, request, toolProvider } = context;
      const results: ToolHandlerResult[] = [];
      let message: string = ``;

      const { generalSecuritySolutionMessage, generateESQLTool, soClient, spaceId } =
        await getDependencies(entityType, esClient, ctx.getStartServices, request, toolProvider);

      const descriptorClient = new PrivilegeMonitoringEngineDescriptorClient({
        soClient,
        namespace: spaceId,
      });

      const engine = await descriptorClient.get();
      const index = getPrivilegedMonitorUsersIndex(spaceId);

      if (engine.status === PRIVILEGE_MONITORING_ENGINE_STATUS.STARTED) {
        if (entityType === EntityTypeEnum.user) {
          message = `
          This is a set of rules that you must follow strictly:
          * A user is privileged if the field 'user.is_privileged' is true.
          * When searching the privileged user you must **ALWAYS** filter by: 'where user.name == {identifier}'.
          * The field 'entity_analytics_monitoring.labels' contains information about the group to which the privileged user belongs.`;

          if (generateESQLTool) {
            const { results: generateESQLResult } = await generateESQLTool.execute({
              toolParams: {
                index,
                query: prompt,
                context: `${message}\n${generalSecuritySolutionMessage}\n${
                  queryExtraContext ?? ''
                }`,
              },
            });
            if (generateESQLResult) {
              results.push(...generateESQLResult);
            }
          }
        } else {
          message = `We do not have information about 'privileged_user_monitoring' for '${entityType}'.`;
        }
      } else {
        message = `The privileged user monitoring engine is not enabled in this environment. The current status is: ${engine.status}. The user needs to enable the privileged user monitoring engine so this agent can answer privileged user-related questions.`;
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
