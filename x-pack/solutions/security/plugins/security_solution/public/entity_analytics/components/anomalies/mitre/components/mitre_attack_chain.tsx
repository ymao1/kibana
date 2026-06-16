/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useMemo } from 'react';
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { css } from '@emotion/react';
import { tacticOrder as mitreTacticOrder } from '../../../../../../common/detection_engine/mitre/mitre_tactics_order';
import { tactics as mitreTactics } from '../../../../../../common/detection_engine/mitre/mitre_tactics_techniques';
import { MitreTacticDot } from './mitre_tactic_dot';

const tacticNames = [...mitreTactics]
  .sort((a, b) => mitreTacticOrder.indexOf(a.id) - mitreTacticOrder.indexOf(b.id))
  .map(({ name }) => name);

interface MitreAttackChainProps {
  anomalyCountByTactic?: Readonly<Record<string, number>>;
  onSelectTactic?: (tactic: string) => void;
  selectedTactic?: string | null;
  showLabels?: boolean;
  triggeredTactics: readonly string[];
}

export const MitreAttackChain: React.FC<MitreAttackChainProps> = ({
  anomalyCountByTactic,
  onSelectTactic,
  selectedTactic,
  showLabels = false,
  triggeredTactics,
}) => {
  const triggeredSet = useMemo(() => new Set(triggeredTactics), [triggeredTactics]);

  return (
    <div
      css={css`
        width: 100%;
        min-width: 0;
        padding-left: 4px;
        padding-right: 4px;
      `}
    >
      <EuiFlexGroup gutterSize="none" responsive={false} wrap={false} alignItems="flexStart">
        {tacticNames.map((tactic, index) => {
          const isDetected = triggeredSet.has(tactic);
          const isClickable = !!onSelectTactic && isDetected;
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
                isSelected={selectedTactic === tactic}
                isClickable={isClickable}
                onClick={isClickable ? () => onSelectTactic?.(tactic) : undefined}
              />
            </EuiFlexItem>
          );
        })}
      </EuiFlexGroup>
    </div>
  );
};
