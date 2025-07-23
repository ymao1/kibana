/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { filterSummaryActions } from './summary';
import { filterUnsupportedActions } from './unsupported';
import { filterThrottled } from './throttled';
import { enrichWithSummarizedAlerts } from './summarized_alerts';

export const reducers = [
  // remove summary actions
  filterSummaryActions,

  filterUnsupportedActions,

  // remove throttled summary actions
  filterThrottled,

  enrichWithSummarizedAlerts,
] as const;
