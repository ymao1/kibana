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
import { updateAssetCriticalityStepCommonDefinition } from '../../../../common/workflows/step_types/update_asset_criticality_step/update_asset_criticality_step_common';

export const getUpdateAssetCriticalityStepDefinition = (
  getEntityStoreStart: () => Promise<EntityStoreStartContract>,
  getWorkflowsExtensionsStart: () => Promise<WorkflowsExtensionsServerPluginStart | undefined>
) =>
  createServerStepDefinition({
    ...updateAssetCriticalityStepCommonDefinition,
    handler: async (context) => {
      const {
        entity_type: entityType,
        entity_id: entityId,
        criticality_level: criticalityLevel,
      } = context.input;

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

        return {
          output: {
            success: true,
            message: `Successfully set criticality level to "${criticalityLevel}" for entity ${entityId}`,
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
