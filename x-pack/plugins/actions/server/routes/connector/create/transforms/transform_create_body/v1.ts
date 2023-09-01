/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { CreateConnectorRequestBodyV1 } from '../../../../../../common/routes/connector/apis/create';
import { ActionTypeConfig, ActionTypeSecrets } from '../../../../../types';

export const transformCreateBody = <
  Config extends ActionTypeConfig = never,
  Secrets extends ActionTypeSecrets = never
>(
  createBody: CreateConnectorRequestBodyV1<Config, Secrets>
): CreateConnectorData<Config, Secrets> => {
  return {
    name: createBody.name,
    actionTypeId: createBody.connector_type_id,
    config: createBody.config,
    secrets: createBody.secrets,
  };
};
