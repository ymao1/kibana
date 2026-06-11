/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useCallback, useMemo } from 'react';
import { css } from '@emotion/react';
import { EuiFlexGroup, EuiFlexItem, EuiSpacer, EuiText, EuiTitle, useEuiTheme } from '@elastic/eui';
import { getAbbreviatedNumber } from '@kbn/cloud-security-posture-common';
import type { GetAnomalyOverviewResponse } from '../../../../common/api/entity_analytics';
import type { EntityDetailsPath } from '../../../flyout/entity_details/shared/components/left_panel/left_panel_header';
import { EntityDetailsLeftPanelTab } from '../../../flyout/entity_details/shared/components/left_panel/left_panel_header';
import { ExpandablePanel } from '../../../flyout_v2/shared/components/expandable_panel';
import { useAnomalyBands } from '../recent_anomalies/anomaly_bands';
import { AnomaliesSwimlane } from './anomalies_swimlane';
import { MitreAttackChain } from './mitre/components/mitre_attack_chain';
import {
  BEHAVIORAL_ANOMALIES_ALL_LINK_TOOLTIP,
  BEHAVIORAL_ANOMALIES_ALL_LINK_TITLE,
  getBehavioralAnomaliesV2TacticsCountLabel,
  getBehavioralAnomaliesCountLabel,
} from './translations';

interface AnomaliesOverviewProps {
  data: GetAnomalyOverviewResponse;
  entityId: string;
  isPreviewMode?: boolean;
  openDetailsPanel: (path: EntityDetailsPath) => void;
}

const StatBlock: React.FC<{
  total: number;
  label: string;
}> = ({ total, label }) => {
  const { euiTheme } = useEuiTheme();
  return (
    <EuiFlexGroup direction="column" gutterSize="none">
      <EuiFlexItem>
        <EuiTitle size="s">
          <h3>{getAbbreviatedNumber(total)}</h3>
        </EuiTitle>
      </EuiFlexItem>
      <EuiFlexItem>
        <EuiText
          size="xs"
          css={css`
            font-weight: ${euiTheme.font.weight.semiBold};
          `}
        >
          {label}
        </EuiText>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

export const AnomaliesOverview: React.FC<AnomaliesOverviewProps> = ({
  data,
  entityId,
  isPreviewMode,
  openDetailsPanel,
}) => {
  const { euiTheme } = useEuiTheme();
  const { bands } = useAnomalyBands();

  const uniqueTactics = useMemo(() => Object.keys(data.tacticCounts), [data.tacticCounts]);
  const uniqueTacticsCount = uniqueTactics.length;
  const totalAnomaliesCount = data.totalAnomaliesCount;

  const swimlaneRecords = useMemo(
    () =>
      data.anomalies.map((a) => ({
        '@timestamp': new Date(a.timestamp).getTime(),
        entity_id: entityId,
        record_score: a.maxScore,
      })),
    [data.anomalies, entityId]
  );

  const goToBehavioralAnomaliesTab = useCallback(
    () => openDetailsPanel({ tab: EntityDetailsLeftPanelTab.ANOMALIES }),
    [openDetailsPanel]
  );

  const link = useMemo(
    () => ({
      callback: goToBehavioralAnomaliesTab,
      tooltip: BEHAVIORAL_ANOMALIES_ALL_LINK_TOOLTIP,
    }),
    [goToBehavioralAnomaliesTab]
  );

  // Both rows use the same template: stat block on the left (`grow={false}`,
  // fixed minimum width so the two stat blocks line up vertically) and the
  // visualization on the right (stretches to fill remaining width).
  const statCellCss = css`
    min-width: 72px;
  `;
  const vizCellCss = css`
    flex: 1;
    min-width: 0;
  `;

  return (
    <ExpandablePanel
      data-test-subj="anomalies-overview-expandable-panel"
      header={{
        iconType: !isPreviewMode ? 'chevronLimitLeft' : undefined,
        title: (
          <EuiText
            size="xs"
            css={{
              fontWeight: euiTheme.font.weight.bold,
            }}
          >
            {BEHAVIORAL_ANOMALIES_ALL_LINK_TITLE}
          </EuiText>
        ),
        link,
      }}
    >
      <EuiFlexGroup gutterSize="m" alignItems="center" responsive={false}>
        <EuiFlexItem grow={false} css={statCellCss}>
          <StatBlock
            total={uniqueTacticsCount}
            label={getBehavioralAnomaliesV2TacticsCountLabel(uniqueTacticsCount)}
          />
        </EuiFlexItem>
        <EuiFlexItem css={vizCellCss}>
          <MitreAttackChain
            triggeredTactics={uniqueTactics}
            anomalyCountByTactic={data.tacticCounts}
            showLabels={false}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size="xl" />
      <EuiFlexGroup
        gutterSize="m"
        alignItems="center"
        responsive={false}
        css={css`
          & > .euiFlexItem:last-child {
            flex: 1;
            min-width: 180px;
          }
        `}
      >
        <EuiFlexItem grow={false} css={statCellCss}>
          <StatBlock
            total={totalAnomaliesCount}
            label={getBehavioralAnomaliesCountLabel(totalAnomaliesCount)}
          />
        </EuiFlexItem>
        <AnomaliesSwimlane
          records={swimlaneRecords}
          from={data.from}
          to={data.to}
          anomalyBands={bands}
          entityNames={[entityId]}
          entityAccessor="entity_id"
          heatmapId="entity-flyout-behavioral-anomalies-v2-heatmap"
        />
      </EuiFlexGroup>
      <EuiSpacer size="s" />
    </ExpandablePanel>
  );
};
