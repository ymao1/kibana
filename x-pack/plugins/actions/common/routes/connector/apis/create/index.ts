/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

export { createBodySchema, createParamsSchema } from './schemas/latest';
export type {
  CreateConnectorRequestBody,
  CreateConnectorRequestParams,
  CreateConnectorResponse,
} from './types/latest';

export {
  createBodySchema as createBodySchemaV1,
  createParamsSchema as createParamsSchemaV1,
} from './schemas/v1';
export type {
  CreateConnectorRequestBody as CreateConnectorRequestBodyV1,
  CreateConnectorRequestParams as CreateConnectorRequestParamsV1,
  CreateConnectorResponse as CreateConnectorResponseV1,
} from './types/v1';
