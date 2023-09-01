/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import Boom from '@hapi/boom';
import { ActionResult, ActionTypeParams, ActionTypeSecrets } from '../../../../types';
import { ActionsClientContext } from '../../../../actions_client';
import { ConnectorType } from '../../types';
import { listTypesParamsSchema } from './schemas';
import { ListTypesParams } from './types';

export async function create<
  Config extends ActionTypeParams = never,
  Secrets extends ActionTypeSecrets = never
>(
  context: ActionsClientContext,
  params: CreateConnectorParams<Config, Secrets>
): Promise<ActionResult> {
  const id = options?.id || SavedObjectsUtils.generateId();

  try {
    await this.context.authorization.ensureAuthorized({
      operation: 'create',
      actionTypeId,
    });
  } catch (error) {
    this.context.auditLogger?.log(
      connectorAuditEvent({
        action: ConnectorAuditAction.CREATE,
        savedObject: { type: 'action', id },
        error,
      })
    );
    throw error;
  }

  const foundInMemoryConnector = this.context.inMemoryConnectors.find(
    (connector) => connector.id === id
  );

  if (
    this.context.actionTypeRegistry.isSystemActionType(actionTypeId) ||
    foundInMemoryConnector?.isSystemAction
  ) {
    throw Boom.badRequest(
      i18n.translate('xpack.actions.serverSideErrors.systemActionCreationForbidden', {
        defaultMessage: 'System action creation is forbidden. Action type: {actionTypeId}.',
        values: {
          actionTypeId,
        },
      })
    );
  }

  if (foundInMemoryConnector?.isPreconfigured) {
    throw Boom.badRequest(
      i18n.translate('xpack.actions.serverSideErrors.predefinedIdConnectorAlreadyExists', {
        defaultMessage: 'This {id} already exists in a preconfigured action.',
        values: {
          id,
        },
      })
    );
  }

  const actionType = this.context.actionTypeRegistry.get(actionTypeId);
  const configurationUtilities = this.context.actionTypeRegistry.getUtils();
  const validatedActionTypeConfig = validateConfig(actionType, config, {
    configurationUtilities,
  });
  const validatedActionTypeSecrets = validateSecrets(actionType, secrets, {
    configurationUtilities,
  });
  if (actionType.validate?.connector) {
    validateConnector(actionType, { config, secrets });
  }
  this.context.actionTypeRegistry.ensureActionTypeEnabled(actionTypeId);

  this.context.auditLogger?.log(
    connectorAuditEvent({
      action: ConnectorAuditAction.CREATE,
      savedObject: { type: 'action', id },
      outcome: 'unknown',
    })
  );

  const result = await this.context.unsecuredSavedObjectsClient.create(
    'action',
    {
      actionTypeId,
      name,
      isMissingSecrets: false,
      config: validatedActionTypeConfig as SavedObjectAttributes,
      secrets: validatedActionTypeSecrets as SavedObjectAttributes,
    },
    { id }
  );

  return {
    id: result.id,
    actionTypeId: result.attributes.actionTypeId,
    isMissingSecrets: result.attributes.isMissingSecrets,
    name: result.attributes.name,
    config: result.attributes.config,
    isPreconfigured: false,
    isSystemAction: false,
    isDeprecated: isConnectorDeprecated(result.attributes),
  };
}
