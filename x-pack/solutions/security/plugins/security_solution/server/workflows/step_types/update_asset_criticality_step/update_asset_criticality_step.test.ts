/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { getUpdateAssetCriticalityStepDefinition } from './update_asset_criticality_step';
import { ExecutionError } from '@kbn/workflows/server';
import type { StepHandlerContext } from '@kbn/workflows-extensions/server';
import type { EntityStoreStartContract } from '@kbn/entity-store/server';

const createMockContext = (input: Record<string, unknown>, esClient: unknown = {}) => {
  return {
    input,
    config: {},
    rawInput: input,
    contextManager: {
      getContext: jest.fn().mockReturnValue({ workflow: { spaceId: 'default' } }),
      getScopedEsClient: jest.fn().mockReturnValue(esClient),
      renderInputTemplate: jest.fn(),
      getFakeRequest: jest.fn(),
      callKibanaApi: jest.fn(),
    },
    logger: {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    },
    abortSignal: new AbortController().signal,
    stepId: 'test-step',
    stepType: 'security.updateAssetCriticality',
  } as unknown as StepHandlerContext<unknown, unknown>;
};

describe('updateAssetCriticalityStepDefinition', () => {
  const updateEntity = jest.fn();
  const createCRUDClient = jest.fn().mockReturnValue({ updateEntity });
  const getEntityStoreStart = jest.fn(
    async () =>
      ({
        createCRUDClient,
      } as unknown as EntityStoreStartContract)
  );

  const updateAssetCriticalityStepDefinition =
    getUpdateAssetCriticalityStepDefinition(getEntityStoreStart);

  beforeEach(() => {
    jest.clearAllMocks();
    createCRUDClient.mockReturnValue({ updateEntity });
  });

  describe('handler', () => {
    it('updates the entity via the Entity Store v2 CRUD client, forcing the criticality field', async () => {
      updateEntity.mockResolvedValue(undefined);
      const esClient = {};
      const mockContext = createMockContext(
        {
          entity_type: 'host',
          entity_id: 'host:my-host',
          criticality_level: 'high_impact',
        },
        esClient
      );

      const result = await updateAssetCriticalityStepDefinition.handler(mockContext);

      expect(createCRUDClient).toHaveBeenCalledWith(esClient, 'default');
      expect(updateEntity).toHaveBeenCalledWith(
        'host',
        { entity: { id: 'host:my-host' }, asset: { criticality: 'high_impact' } },
        true
      );
      expect(result).toEqual({
        output: {
          success: true,
          message: 'Successfully set criticality level to "high_impact" for entity host:my-host',
        },
      });
    });

    it('should throw ExecutionError if the CRUD client throws', async () => {
      updateEntity.mockRejectedValue(new Error('not found'));
      const mockContext = createMockContext({
        entity_type: 'host',
        entity_id: 'host:my-host',
        criticality_level: 'high_impact',
      });

      await expect(updateAssetCriticalityStepDefinition.handler(mockContext)).rejects.toThrow(
        ExecutionError
      );
    });
  });
});
