/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { TypeOf } from '@kbn/config-schema';
import { createBodySchemaV1, createParamsSchemaV1 } from '..';
import { ConnectorConfigV1, ConnectorResponseV1, ConnectorSecretsV1 } from '../../../response';

type CreateBodySchema = TypeOf<typeof createBodySchemaV1>;
export type CreateConnectorRequestParams = TypeOf<typeof createParamsSchemaV1>;

export interface CreateConnectorRequestBody<
  Config extends ConnectorConfigV1 = never,
  Secrets extends ConnectorSecretsV1 = never
> {
  name: CreateBodySchema['name'];
  connector_type_id: CreateBodySchema['connector_type_id'];
  config: Config;
  secrets: Secrets;
}

export interface CreateConnectorResponse<Config extends ConnectorConfigV1 = never> {
  body: ConnectorResponseV1<Config>;
}
