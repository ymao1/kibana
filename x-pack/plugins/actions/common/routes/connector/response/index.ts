/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

// Latest
export type {
  ConnectorResponse,
  ActionTypeConfig,
  ConnectorConfig,
  ConnectorSecrets,
} from './types/latest';
export {
  connectorResponseSchema,
  connectorTypesResponseSchema,
  connectorConfigSchema,
  connectorSecretsSchema,
} from './schemas/latest';

// v1
export type {
  ConnectorResponse as ConnectorResponseV1,
  ActionTypeConfig as ActionTypeConfigV1,
  ConnectorTypesResponse as ConnectorTypesResponseV1,
  ConnectorConfig as ConnectorConfigV1,
  ConnectorSecrets as ConnectorSecretsV1,
} from './types/v1';
export {
  connectorResponseSchema as connectorResponseSchemaV1,
  connectorTypesResponseSchema as connectorTypesResponseSchemaV1,
  connectorConfigSchema as connectorConfigSchemaV1,
  connectorSecretsSchema as connectorSecretsSchemaV1,
} from './schemas/v1';
