/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { trim } from 'lodash';
import type { EntityType } from '@kbn/entity-store/common';
import type { AnomalySummaryEntry } from '../../../../../common/api/entity_analytics';
import type { TableRow } from './types';
import {
  anomalyToDisplayDetails,
  formatValueBasedOnFieldName,
  getComparatorForDetectorFunction,
} from './anomaly_formatter_utils';

const SECONDS_PER_DAY = 86400;
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const TEMPORAL_DETECTORS = new Set(['time_of_day', 'time_of_week']);

const formatSeconds = (rawSeconds: string, isWeek: boolean): string => {
  const totalSecs = parseFloat(rawSeconds);
  if (!Number.isFinite(totalSecs)) return rawSeconds;
  const secsInDay = isWeek ? totalSecs % SECONDS_PER_DAY : totalSecs;
  const h = String(Math.floor(secsInDay / 3600) % 24).padStart(2, '0');
  const m = String(Math.floor((secsInDay % 3600) / 60)).padStart(2, '0');
  if (isWeek) {
    const dayIdx = Math.floor(totalSecs / SECONDS_PER_DAY) % 7;
    return `${DAY_NAMES[dayIdx]} ${h}:${m}`;
  }
  return `${h}:${m}`;
};

const buildComparisonPhrase = (entry: AnomalySummaryEntry): string => {
  const { detectorFunction: fn } = entry;
  if (TEMPORAL_DETECTORS.has(fn) || fn === 'rare') return '';

  const observed = entry.actual[0] ?? 0;
  const expected = entry.typical[0] ?? 0;
  if (expected === 0) return '';

  if (fn.startsWith('high') && observed > expected) {
    return `, which is ${(observed / expected).toFixed(1)}× greater than baseline`;
  }
  if (fn.startsWith('low') && observed < expected && observed > 0) {
    return `, which is ${(expected / observed).toFixed(1)}× less than baseline`;
  }
  return '';
};

export const buildDescription = (
  entityType: EntityType,
  entry: AnomalySummaryEntry,
  detectorDescription?: string
): string => {
  const { observedHeader, expectedSubtitle } = anomalyToDisplayDetails(entityType, entry);
  const base = trim([observedHeader, expectedSubtitle].filter(Boolean).join(' ')) || '—';
  const comparison = buildComparisonPhrase(entry);
  const detail = base === '—' ? base : `${base}${comparison}`;
  const prefix = detectorDescription?.replace(/\.$/, '');
  return prefix ? `${prefix}: ${detail}` : detail;
};

interface BaselineAndAnomaly {
  baseline: string;
  anomaly: string;
}

// For `time_of_day` / `time_of_week` detectors, the anomalousValue and baselineValues are
// seconds since midnight (or since Sunday midnight for time_of_week). Format them as human-readable
// clock strings ("HH:mm" / "Day HH:mm") for display.
const formatTemporalBaselineAndAnomaly = (entry: AnomalySummaryEntry): BaselineAndAnomaly => {
  const isWeek = entry.detectorFunction === 'time_of_week';
  const anomaly = formatSeconds(entry.anomalousValue ?? '—', isWeek);
  const rawBaseline = entry.baselineValues?.length > 0 ? entry.baselineValues.join(', ') : '—';
  const baseline = formatSeconds(rawBaseline, isWeek);
  return { baseline, anomaly };
};

// Format a string value with field-aware units. Categorical strings (e.g. rare by_field_values
// like "Iran") pass through unchanged because parseFloat returns NaN for non-numeric strings.
const formatFieldValue = (value: string, fieldName: string | null, fn: string): string => {
  const num = parseFloat(value);
  return Number.isFinite(num) ? formatValueBasedOnFieldName(fn, fieldName, num) : value;
};

// For `rare` functions, values are categorical strings — no units or comparator needed.
const formatRareBaselineAndAnomaly = (entry: AnomalySummaryEntry): BaselineAndAnomaly => {
  const anomaly = entry.anomalousValue ?? '—';
  const baseline = entry.baselineValues?.length > 0 ? entry.baselineValues.join(', ') : '—';
  return { baseline, anomaly };
};

// For metric functions: format values with field-aware units and prefix the baseline with a
// comparator (≤ for high_ functions, ≥ for low_ functions) to indicate direction of anomaly.
const formatMetricBaselineAndAnomaly = (entry: AnomalySummaryEntry): BaselineAndAnomaly => {
  const { fieldName, detectorFunction: fn } = entry;
  const fmt = (v: string) => formatFieldValue(v, fieldName, fn);
  const comparator = getComparatorForDetectorFunction(fn);
  const anomaly = entry.anomalousValue != null ? fmt(entry.anomalousValue) : '—';
  const rawBaseline =
    entry.baselineValues?.length > 0 ? entry.baselineValues.map(fmt).join(', ') : null;
  const baseline = rawBaseline != null ? `${comparator}${rawBaseline}` : '—';
  return { baseline, anomaly };
};

export const formatBaselineAndAnomaly = (entry: AnomalySummaryEntry): BaselineAndAnomaly => {
  const { detectorFunction: fn } = entry;
  if (TEMPORAL_DETECTORS.has(fn)) return formatTemporalBaselineAndAnomaly(entry);
  if (fn === 'rare') return formatRareBaselineAndAnomaly(entry);
  return formatMetricBaselineAndAnomaly(entry);
};

export const mapSummaryToRow = (
  entityType: EntityType,
  entry: AnomalySummaryEntry,
  index: number,
  detectorDescription?: string
): TableRow => {
  const { baseline, anomaly } = formatBaselineAndAnomaly(entry);
  const description = buildDescription(entityType, entry, detectorDescription);

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
