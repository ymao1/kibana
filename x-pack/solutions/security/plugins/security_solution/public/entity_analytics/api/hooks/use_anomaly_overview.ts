/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { useQuery } from '@kbn/react-query';
import type { EntityType } from '../../../../common/entity_analytics/types';
import { useEntityAnalyticsRoutes } from '../api';

export const ANOMALY_OVERVIEW_QUERY_KEY = ['POST', 'FETCH_ANOMALY_OVERVIEW'] as const;

interface UseAnomalyOverviewParams {
  entityId: string;
  entityType: string;
  from?: number;
  to?: number;
  enabled?: boolean;
}

export const useAnomalyOverview = ({
  entityId,
  entityType,
  from,
  to,
  enabled = true,
}: UseAnomalyOverviewParams) => {
  const { fetchAnomalyOverview } = useEntityAnalyticsRoutes();

  const body = from !== undefined || to !== undefined ? { from, to } : undefined;

  return useQuery(
    [...ANOMALY_OVERVIEW_QUERY_KEY, entityType, entityId, from, to],
    ({ signal }) => fetchAnomalyOverview({ entityType, entityId, body, signal }),
    { enabled: enabled && !!entityId }
  );
};
