/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { ActionTypeConfig, ActionTypeSecrets } from '../../../../../types';
import { ConnectorResponseV1 } from '../../../../../../common/routes/connector/response';

export const transformConnectorResultToConnectorResponse = <
  Config extends ActionTypeConfig = never,
  Secrets extends ActionTypeSecrets = never
>(
  result: ConnectorResult<Config, Secrets>
): ConnectorResponseV1<Config> => {
  return {
    id: result.id,
    connector_type_id: result.actionTypeId,
    name: result.name,
    is_missing_secrets: result.isMissingSecrets,
    config: result.config,
    is_preconfigured: result.isPreconfigured,
    is_deprecated: result.isDeprecated,
    is_system_action: result.isSystemAction,
  };
};
