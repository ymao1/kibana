/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { ML_PAGES, useMlHref } from '@kbn/ml-plugin/public';
import { useKibana } from '../../../../common/lib/kibana/use_kibana';
import type { TableRow } from './types';

interface TimeRange {
  from: string;
  to: string;
}

export const useAnomalySingleMetricViewerUrl = (
  row: TableRow,
  timeRange: TimeRange
): string | undefined => {
  const {
    services: { http, ml },
  } = useKibana();

  return useMlHref(
    ml,
    http.basePath.get(),
    {
      page: ML_PAGES.SINGLE_METRIC_VIEWER,
      pageState: {
        jobIds: [row.jobId],
        timeRange: {
          from: timeRange.from,
          to: timeRange.to,
          mode: 'relative',
        },
        detectorIndex: row.detectorIndex ?? 0,
        // entities: row.entities,
      },
    },
    [row.jobId, timeRange.from, timeRange.to]
  );
};
