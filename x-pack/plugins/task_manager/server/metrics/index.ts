/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { Observable } from 'rxjs';
import { TaskManagerConfig } from '../config';
import { Metrics, createMetricsAggregators, createMetricsStream } from './metrics_stream';
import { TaskPollingLifecycle } from '../polling_lifecycle';
export type { Metrics } from './metrics_stream';

interface MetricsStreamOpts {
  config: TaskManagerConfig;
  resetMetrics$: Observable<boolean>; // emits when counter metrics should be reset
  taskPollingLifecycle?: TaskPollingLifecycle; // subscribe to task lifecycle events
}

export function metricsStream({
  config,
  resetMetrics$,
  taskPollingLifecycle,
}: MetricsStreamOpts): Observable<Metrics> {
  return createMetricsStream(
    createMetricsAggregators({
      config,
      resetMetrics$,
      taskPollingLifecycle,
    })
  );
}
