/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useMemo } from 'react';
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { css } from '@emotion/react';
import { MitreTacticDot } from './mitre_tactic_dot';
import { tactics as mitreTactics } from '../../../../../../common/detection_engine/mitre/mitre_tactics_techniques';

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

interface MitreAttackChainProps {
  triggeredTactics: readonly string[];
  /** When true, renders the tactic name under each dot (truncated + tooltip). */
  showLabels?: boolean;
  /**
   * Optional per-tactic anomaly counts. When provided, each dot is wrapped in
   * a chart-style tooltip showing "<tactic> — <N> anomalies" on hover. Pass
   * `undefined` to disable hover tooltips on the dots.
   */
  anomalyCountByTactic?: Readonly<Record<string, number>>;
}

export const MitreAttackChain: React.FC<MitreAttackChainProps> = ({
  triggeredTactics,
  showLabels = false,
  anomalyCountByTactic,
}) => {
  const triggeredSet = useMemo(() => new Set(triggeredTactics), [triggeredTactics]);

  return (
    <div
      css={css`
        width: 100%;
        min-width: 0;
        /* Outer halo of the leftmost dot extends 4px to the left of the cell. */
        padding-left: 4px;
        padding-right: 4px;
      `}
    >
      <EuiFlexGroup gutterSize="none" responsive={false} wrap={false} alignItems="flexStart">
        {tacticNames.map((tactic, index) => {
          const isDetected = triggeredSet.has(tactic);
          return (
            <EuiFlexItem
              key={tactic}
              grow
              css={css`
                min-width: 0;
              `}
            >
              <MitreTacticDot
                tactic={tactic}
                detected={isDetected}
                showLabel={showLabels}
                isLast={index === tacticNames.length - 1}
                anomalyCount={anomalyCountByTactic?.[tactic]}
              />
            </EuiFlexItem>
          );
        })}
      </EuiFlexGroup>
    </div>
  );
};
