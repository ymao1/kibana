/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { filterSummaryActions } from './summary';
import { filterUnsupportedActions } from './unsupported';
import { enrichWithSummarizedAlerts } from './summarized_alerts';
import { logActions } from './log';

export const reducers = [
  // remove summary actions
  filterSummaryActions,

  // remove unsupported actions
  filterUnsupportedActions,

  // enrich with summarized alerts
  enrichWithSummarizedAlerts,

  // log
  logActions,
] as const;
