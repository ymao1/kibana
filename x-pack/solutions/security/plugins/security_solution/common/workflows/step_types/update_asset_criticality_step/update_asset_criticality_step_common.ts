/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { z } from '@kbn/zod/v4';
import { StepCategory } from '@kbn/workflows';
import type { BaseStepDefinition } from '@kbn/workflows';
import { i18n } from '@kbn/i18n';
import { EntityType } from '@kbn/entity-store/common';
import { AssetCriticalityLevel } from '@kbn/entity-store/common/domain/definitions/entity.gen';
import { MAX_ENTITY_ID_VALUE_LENGTH, MAX_WORKFLOW_MESSAGE_LENGTH } from '../common/constants';

export const UpdateAssetCriticalityStepId = 'security.updateAssetCriticality' as const;

export const updateAssetCriticalityInputSchema = z.object({
  entity_type: EntityType.describe('The Entity Store entity type, e.g. "host" or "user"'),
  entity_id: z
    .string()
    .min(1)
    .max(MAX_ENTITY_ID_VALUE_LENGTH)
    .describe('The Entity Store entity ID (EUID), e.g. "host:my-host"'),
  criticality_level: AssetCriticalityLevel.describe(
    'The criticality level to assign to the entity'
  ),
});

export const updateAssetCriticalityOutputSchema = z.object({
  success: z.boolean(),
  message: z.string().max(MAX_WORKFLOW_MESSAGE_LENGTH).optional(),
});

export const updateAssetCriticalityStepCommonDefinition: BaseStepDefinition<
  typeof updateAssetCriticalityInputSchema,
  typeof updateAssetCriticalityOutputSchema
> = {
  id: UpdateAssetCriticalityStepId,
  label: i18n.translate('xpack.securitySolution.workflows.steps.updateAssetCriticality.label', {
    defaultMessage: 'Update Asset Criticality',
  }),
  description: i18n.translate(
    'xpack.securitySolution.workflows.steps.updateAssetCriticality.description',
    {
      defaultMessage: 'Set the asset criticality level for an Entity Store entity.',
    }
  ),
  category: StepCategory.KibanaSecurity,
  inputSchema: updateAssetCriticalityInputSchema,
  outputSchema: updateAssetCriticalityOutputSchema,
  documentation: {
    details: i18n.translate(
      'xpack.securitySolution.workflows.steps.updateAssetCriticality.documentation.details',
      {
        defaultMessage:
          'Sets or updates the asset criticality level for an Entity Store (v2) entity, ' +
          'identified by its entity type and entity ID (EUID).',
      }
    ),
    examples: [
      `## Set criticality for a host
\`\`\`yaml
- name: mark_host_critical
  type: security.updateAssetCriticality
  with:
    entity_type: "host"
    entity_id: "{{ variables.host_entity_id }}"
    criticality_level: "high_impact"
\`\`\``,
    ],
  },
};
