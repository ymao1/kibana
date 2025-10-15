/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */
import { z } from '@kbn/zod';

const PORT_MAX = 256 * 256 - 1;
export const portSchema = () => z.coerce.number().min(1).max(PORT_MAX);

const ConfigSchemaProps = {
  service: z.string().default('other'),
  host: z.string().nullable().default(null),
  port: portSchema().nullable().default(null),
  secure: z.boolean().nullable().default(null),
  from: z.string(),
  hasAuth: z.boolean().default(true),
  tenantId: z.string().nullable().default(null),
  clientId: z.string().nullable().default(null),
  oauthTokenUrl: z.string().nullable().default(null),
};

export const ConfigSchema = z.object(ConfigSchemaProps).strict();
