/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { KibanaRequest, Logger, SavedObjectsClientContract } from '@kbn/core/server';
import type { EntityType } from '@kbn/entity-store/common';
import { euid } from '@kbn/entity-store/common/euid_helpers';
import type { MlPluginSetup } from '@kbn/ml-plugin/server';
import type { AnomalyOverviewEntry } from '../../../../common/api/entity_analytics';
import { getJobConfig, getSecurityMlJobIds } from '../ml_anomaly_detection';

const DEFAULT_OVERVIEW_LOOKBACK_MS = 30 * 24 * 60 * 60 * 1000;

interface TimeBucket {
  key_as_string: string;
  key: number;
  doc_count: number;
  max_score: { value: number | null };
  jobs: { buckets: Array<{ key: string; doc_count: number }> };
}

interface OverviewAggs {
  by_time: { buckets: TimeBucket[] };
  all_jobs: { buckets: Array<{ key: string }> };
}

interface GetEntityAnomalyOverviewParams {
  entityId: string;
  entityType: EntityType;
  fromMs?: number;
  toMs?: number;
  logger: Logger;
  ml: MlPluginSetup;
  soClient: SavedObjectsClientContract;
}

interface AnomalyOverview {
  anomalies: AnomalyOverviewEntry[];
  tacticCounts: Record<string, number>;
  totalAnomaliesCount: number;
  from: number;
  to: number;
}

export const getEntityAnomalyOverview = async ({
  entityId,
  entityType,
  fromMs,
  toMs,
  logger,
  ml,
  soClient,
}: GetEntityAnomalyOverviewParams): Promise<AnomalyOverview> => {
  const effectiveToMs = toMs ?? Date.now();
  const effectiveFromMs = fromMs ?? effectiveToMs - DEFAULT_OVERVIEW_LOOKBACK_MS;
  const empty = {
    anomalies: [],
    tacticCounts: {},
    totalAnomaliesCount: 0,
    from: effectiveFromMs,
    to: effectiveToMs,
  };

  const mlSystem = ml.mlSystemProvider({} as KibanaRequest, soClient);
  const securityJobIds = await getSecurityMlJobIds({ ml, soClient });

  if (securityJobIds.length === 0) return empty;

  let aggs: OverviewAggs | undefined;
  let totalAnomaliesCount = 0;

  try {
    const resp = await mlSystem.mlAnomalySearch(
      {
        size: 0,
        runtime_mappings: {
          entity_id: euid.painless.getEuidRuntimeMapping(entityType),
        },
        query: {
          bool: {
            filter: [
              { term: { result_type: 'record' } },
              { term: { is_interim: false } },
              { range: { record_score: { gte: 1 } } },
              { range: { timestamp: { gte: effectiveFromMs, lte: effectiveToMs } } },
              { term: { entity_id: entityId } },
              { terms: { job_id: securityJobIds } },
            ],
          },
        },
        aggs: {
          by_time: {
            date_histogram: {
              field: 'timestamp',
              calendar_interval: '1d',
            },
            aggs: {
              max_score: { max: { field: 'record_score' } },
              jobs: { terms: { field: 'job_id', size: 200 } },
            },
          },
          all_jobs: {
            terms: { field: 'job_id', size: 200 },
          },
        },
      },
      []
    );

    aggs = resp.aggregations as unknown as OverviewAggs | undefined;
    const total = resp.hits.total;
    totalAnomaliesCount = total == null ? 0 : typeof total === 'number' ? total : total.value;
  } catch (err) {
    logger.warn(`Error fetching anomaly overview for "${entityId}": ${err}`);
    return empty;
  }

  const allJobIds = (aggs?.all_jobs?.buckets ?? []).map((b) => b.key);
  if (allJobIds.length === 0) return empty;

  const jobConfigs = await getJobConfig({ jobIds: allJobIds, logger, ml, soClient });

  // Build jobId → tactics lookup once, reused per bucket.
  const tacticsByJob = new Map(
    allJobIds.map((id) => [id, jobConfigs.get(id)?.threatTactics ?? []])
  );

  const anomalies: AnomalyOverviewEntry[] = (aggs?.by_time?.buckets ?? [])
    .filter((b) => b.doc_count > 0 && b.max_score.value !== null)
    .map((b) => {
      const bucketJobIds = b.jobs.buckets.map((j) => j.key);
      const threatTactics = [...new Set(bucketJobIds.flatMap((id) => tacticsByJob.get(id) ?? []))];
      return {
        timestamp: new Date(b.key).toISOString(),
        maxScore: b.max_score.value as number,
        threatTactics,
      };
    });

  const tacticCounts: Record<string, number> = {};
  for (const bucket of aggs?.by_time?.buckets ?? []) {
    for (const jobBucket of bucket.jobs.buckets) {
      for (const tactic of tacticsByJob.get(jobBucket.key) ?? []) {
        tacticCounts[tactic] = (tacticCounts[tactic] ?? 0) + jobBucket.doc_count;
      }
    }
  }

  return { anomalies, tacticCounts, totalAnomaliesCount, from: effectiveFromMs, to: effectiveToMs };
};
