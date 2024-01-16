/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import { schema } from '@kbn/config-schema';

export const scheduleBackfillOptionsSchema = schema.object({
  ruleIds: schema.arrayOf(schema.string(), { minSize: 1, maxSize: 10 }),
  start: schema.string(),
  end: schema.maybe(schema.string()),
  dependencies: schema.maybe(
    schema.arrayOf(schema.object({ id: schema.string(), spaceId: schema.maybe(schema.string()) }))
  ),
});
