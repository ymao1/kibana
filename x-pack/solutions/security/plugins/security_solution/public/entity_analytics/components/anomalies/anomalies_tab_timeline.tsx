/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useMemo } from 'react';
import { EuiFlexGroup, EuiSpacer, EuiTitle } from '@elastic/eui';
import { css } from '@emotion/react';
import { i18n } from '@kbn/i18n';
import type { AnomalySummaryEntry } from '../../../../common/api/entity_analytics';
import { tactics as mitreTactics } from '../../../../common/detection_engine/mitre/mitre_tactics_techniques';
import { AnomaliesSwimlane } from './anomalies_swimlane';
import { useAnomalyBands } from '../recent_anomalies';

// Copied from x-pack/solutions/security/plugins/security_solution/public/detection_engine/rule_management/logic/coverage_overview/build_coverage_overview_mitre_graph.ts
// Move to a shared location.
const tacticOrder = [
  'TA0043',
  'TA0042',
  'TA0001',
  'TA0002',
  'TA0003',
  'TA0004',
  'TA0005',
  'TA0006',
  'TA0007',
  'TA0008',
  'TA0009',
  'TA0011',
  'TA0010',
  'TA0040',
];
const tacticNames = [...mitreTactics]
  .sort((a, b) => tacticOrder.indexOf(a.id) - tacticOrder.indexOf(b.id))
  .map(({ name }) => name);

const ENTITY_ACCESSOR = 'mitre_tactic';

const tacticIndexByName = new Map(tacticNames.map((name, i) => [name, i]));

interface AnomalyTabTimelineProps {
  timeRangeMs: { from: number; to: number };
  anomalies: AnomalySummaryEntry[];
}

export const AnomalyTabTimelineSection: React.FC<AnomalyTabTimelineProps> = ({
  timeRangeMs,
  anomalies,
}) => {
  const { bands } = useAnomalyBands();

  // Expand each anomaly into one record per tactic, sorted in canonical ATT&CK
  // kill-chain order so that `ySortPredicate="dataIndex"` preserves that order.
  const records = useMemo(() => {
    const expanded = anomalies.flatMap((entry) =>
      (entry.threatTactics ?? []).map((tactic) => ({
        '@timestamp': new Date(entry.timestamp).getTime(),
        [ENTITY_ACCESSOR]: tactic,
        record_score: entry.recordScore,
      }))
    );
    return expanded.sort(
      (a, b) =>
        (tacticIndexByName.get(a[ENTITY_ACCESSOR]) ?? Number.MAX_SAFE_INTEGER) -
        (tacticIndexByName.get(b[ENTITY_ACCESSOR]) ?? Number.MAX_SAFE_INTEGER)
    );
  }, [anomalies]);

  console.log(records);

  const entityNames = useMemo(() => {
    const present = new Set(records.map((r) => r[ENTITY_ACCESSOR]));
    return tacticNames.filter((name) => present.has(name));
  }, [records]);

  return (
    <div>
      <EuiTitle size="xs">
        <h3>
          {i18n.translate('xpack.securitySolution.entityAnalytics.anomaliesTab.timelineTitle', {
            defaultMessage: 'Anomaly timeline',
          })}
        </h3>
      </EuiTitle>
      <EuiSpacer size="m" />
      <EuiFlexGroup
        css={css`
          & > .euiFlexItem {
            flex: 1;
            min-width: 0;
          }
        `}
      >
        <AnomaliesSwimlane
          records={records}
          anomalyBands={bands}
          from={timeRangeMs.from}
          to={timeRangeMs.to}
          entityNames={entityNames}
          entityAccessor={ENTITY_ACCESSOR}
          heatmapId="entity-anomaly-tab-timeline-heatmap"
          ySortPredicate="dataIndex"
        />
      </EuiFlexGroup>
    </div>
  );
};
