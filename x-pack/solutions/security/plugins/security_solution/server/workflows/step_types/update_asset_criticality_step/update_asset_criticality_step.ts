/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import {
  createServerStepDefinition,
  type WorkflowsExtensionsServerPluginStart,
} from '@kbn/workflows-extensions/server';
import { ExecutionError } from '@kbn/workflows/server';
import type { EntityStoreStartContract } from '@kbn/entity-store/server';
import type { LicensingPluginStart } from '@kbn/licensing-plugin/server';
import { updateAssetCriticalityStepCommonDefinition } from '../../../../common/workflows/step_types/update_asset_criticality_step/update_asset_criticality_step_common';

export const getUpdateAssetCriticalityStepDefinition = (
  getEntityStoreStart: () => Promise<EntityStoreStartContract>,
  getWorkflowsExtensionsStart: () => Promise<WorkflowsExtensionsServerPluginStart | undefined>,
  getLicensingStart: () => Promise<LicensingPluginStart>,
  isEntityStoreV2Enabled: boolean
) =>
  createServerStepDefinition({
    ...updateAssetCriticalityStepCommonDefinition,
    handler: async (context) => {
      const {
        entity_type: entityType,
        entity_id: entityId,
        criticality_level: criticalityLevel,
      } = context.input;
      const { 'recalculate-risk-score': recalculateRiskScore } = context.config;

      try {
        const entityStore = await getEntityStoreStart();
        const esClient = context.contextManager.getScopedEsClient();
        const { workflow } = context.contextManager.getContext();
        const workflowsExtensions = await getWorkflowsExtensionsStart();
        const crudClient = entityStore.createCRUDClient(
          esClient,
          workflow.spaceId,
          workflowsExtensions
            ? () => workflowsExtensions.getClient(context.contextManager.getFakeRequest())
            : undefined
        );

        // `force: true` is required because `asset.criticality` is not marked
        // `allowAPIUpdate` in the Entity Store field retention definitions.
        await crudClient.updateEntity(
          entityType,
          { entity: { id: entityId }, asset: { criticality: criticalityLevel } },
          true
        );

        let message = `Successfully set criticality level to "${criticalityLevel}" for entity ${entityId}`;

        // Risk score recalculation is only available for Entity Store v2 and requires
        // at least a platinum license, matching the `/internal/risk_score/calculation/entity_v2`
        // route's own gating.
        if (recalculateRiskScore && isEntityStoreV2Enabled) {
          const licensing = await getLicensingStart();
          const license = await licensing.getLicense();

          if (license.hasAtLeast('platinum')) {
            await context.contextManager.callKibanaApi({
              method: 'POST',
              path: '/internal/risk_score/calculation/entity_v2',
              body: {
                identifier: entityId,
                identifier_type: entityType,
                entity_id: entityId,
              },
            });
            message += ' and triggered risk score recalculation';
          }
        }

        return {
          output: {
            success: true,
            message,
          },
        };
      } catch (error) {
        if (error instanceof ExecutionError) {
          throw error;
        }
        throw new ExecutionError({
          type: 'ApiError',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          details: { error },
        });
      }
    },
  });
