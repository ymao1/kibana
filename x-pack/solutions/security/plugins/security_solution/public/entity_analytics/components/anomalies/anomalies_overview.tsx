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
import type { AnomalyBand } from '../recent_anomalies/anomaly_bands';
import { AnomaliesSwimlane } from './anomalies_swimlane';
import { MitreAttackChain } from './mitre/components/mitre_attack_chain';
import {
  ENTITY_ANOMALIES_ALL_LINK_TOOLTIP,
  ENTITY_ANOMALIES_ALL_LINK_TITLE,
  getEntityAnomaliesTacticsCountLabel,
  getEntityAnomaliesCountLabel,
} from './translations';

const ENTITY_ACCESSOR_KEY = 'entity_id';
interface StatBlockProps {
  total: number;
  label: string;
}

const StatBlock: React.FC<StatBlockProps> = ({ total, label }) => {
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

interface AnomaliesOverviewProps {
  anomalyBands: AnomalyBand[];
  data: GetAnomalyOverviewResponse;
  entityId: string;
  isPreviewMode?: boolean;
  openDetailsPanel: (path: EntityDetailsPath) => void;
}

export const AnomaliesOverview: React.FC<AnomaliesOverviewProps> = ({
  anomalyBands,
  data,
  entityId,
  isPreviewMode,
  openDetailsPanel,
}) => {
  const { euiTheme } = useEuiTheme();

  const uniqueTactics = useMemo(() => Object.keys(data.tacticCounts), [data.tacticCounts]);
  const uniqueTacticsCount = uniqueTactics.length;
  const totalAnomaliesCount = data.totalAnomaliesCount;

  const swimlaneRecords = useMemo(
    () =>
      data.anomalies.map((a) => ({
        '@timestamp': new Date(a.timestamp).getTime(),
        [ENTITY_ACCESSOR_KEY]: entityId,
        record_score: a.maxScore,
      })),
    [data.anomalies, entityId]
  );

  const goToAnomaliesTab = useCallback(
    () => openDetailsPanel({ tab: EntityDetailsLeftPanelTab.ANOMALIES }),
    [openDetailsPanel]
  );

  const link = useMemo(
    () => ({
      callback: goToAnomaliesTab,
      tooltip: ENTITY_ANOMALIES_ALL_LINK_TOOLTIP,
    }),
    [goToAnomaliesTab]
  );

  const statCellCss = css`
    min-width: 72px;
  `;

  return (
    <ExpandablePanel
      data-test-subj="entity-anomalies-overview-expandable-panel"
      header={{
        iconType: !isPreviewMode ? 'chevronLimitLeft' : undefined,
        title: (
          <EuiText
            size="xs"
            css={{
              fontWeight: euiTheme.font.weight.bold,
            }}
          >
            {ENTITY_ANOMALIES_ALL_LINK_TITLE}
          </EuiText>
        ),
        link,
      }}
    >
      {/* MITRE ATT&CK Tactics */}
      <EuiFlexGroup gutterSize="m" alignItems="center" responsive={false}>
        <EuiFlexItem grow={false} css={statCellCss}>
          <StatBlock
            total={uniqueTacticsCount}
            label={getEntityAnomaliesTacticsCountLabel(uniqueTacticsCount)}
          />
        </EuiFlexItem>
        <EuiFlexItem
          css={css`
            flex: 1;
            min-width: 0;
          `}
        >
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
        data-test-subj="entity-anomalies-overview-swimlane"
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
            label={getEntityAnomaliesCountLabel(totalAnomaliesCount)}
          />
        </EuiFlexItem>
        <AnomaliesSwimlane
          anomalyBands={anomalyBands}
          records={swimlaneRecords}
          from={data.from}
          to={data.to}
          yAxisNames={[entityId]}
          yAxisAccessor={ENTITY_ACCESSOR_KEY}
          heatmapId="entity-anomalies-overview-heatmap"
        />
      </EuiFlexGroup>
      <EuiSpacer size="s" />
    </ExpandablePanel>
  );
};
