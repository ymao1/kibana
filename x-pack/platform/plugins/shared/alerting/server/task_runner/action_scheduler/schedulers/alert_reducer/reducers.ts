/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import { filterActiveMaintenanceWindows } from './maintenance_window';
import { filterMuted } from './muted';
import { filterPendingRecovered } from './pending_recovered';
import { filterSummarizedAlerts } from './summarized';

export const reducers = [
  filterActiveMaintenanceWindows,
  filterMuted,
  filterPendingRecovered,
  filterSummarizedAlerts,
] as const;
