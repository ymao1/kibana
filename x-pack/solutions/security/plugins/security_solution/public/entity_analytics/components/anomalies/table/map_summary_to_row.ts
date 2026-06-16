/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { AnomalySummaryEntry } from '../../../../../common/api/entity_analytics';
import type { TableRow } from './types';

export const mapSummaryToRow = (entry: AnomalySummaryEntry, index: number): TableRow => {
  const baseline =
    entry.baselineValues.length > 0
      ? entry.baselineValues.slice(0, 3).join(', ')
      : entry.typical.length > 0
      ? String(entry.typical[0])
      : '—';

  const anomaly = entry.anomalousValue ?? (entry.actual.length > 0 ? String(entry.actual[0]) : '—');

  const fieldParts = [entry.byFieldValue, entry.overFieldValue, entry.partitionFieldValue].filter(
    Boolean
  );
  const description = `${entry.detectorFunction}${
    fieldParts.length > 0 ? `: ${fieldParts.join(', ')}` : ''
  }`;

  return {
    id: `${entry.jobId}-${entry.timestamp}-${index}`,
    jobId: entry.jobId,
    jobDisplayName: entry.jobName ?? entry.jobId,
    mitreTactics: entry.threatTactics ?? [],
    timestamp: new Date(entry.timestamp).getTime(),
    detectorIndex: entry.detectorIndex,
    baseline,
    anomaly,
    anomalyScore: entry.recordScore,
    description,
  };
};
