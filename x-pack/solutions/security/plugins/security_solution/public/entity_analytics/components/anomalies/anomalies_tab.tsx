/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  EuiButtonEmpty,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiSpacer,
  EuiSuperDatePicker,
  EuiTitle,
  type OnTimeChangeProps,
} from '@elastic/eui';
// import { i18n } from '@kbn/i18n';
import { css } from '@emotion/react';
import moment from 'moment';
import { ML_PAGES, useMlManagementHref } from '@kbn/ml-plugin/public';
import type { EntityType } from '@kbn/entity-store/common';
import { parseDateWithDefault } from '../../../common/utils/default_date_settings';
import { useKibana } from '../../../common/lib/kibana';
import { ENTITY_ANOMALY_DEFAULT_LOOKBACK } from '../../../../common/entity_analytics/anomalies/constants';

import { useAnomalyOverview } from '../../api/hooks/use_anomaly_overview';
import { ANOMALY_TIMELINE_V2_MANAGE_ML_JOBS, ATTACK_CHAIN_V2_TITLE } from './translations';
import { useAnomalySummary } from '../../api/hooks/use_anomaly_summary';
import { MitreAttackChain } from './mitre/components/mitre_attack_chain';
import { AnomalyTabTimelineSection } from './anomalies_tab_timeline';
import { AnomalyTabTableSection } from './anomalies_tab_table';

interface AnomaliesTabProps {
  entityId: string;
  entityType: EntityType;
}

export const AnomaliesTab: React.FC<AnomaliesTabProps> = ({ entityId, entityType }) => {
  const [start, setStart] = useState<string>(`now-${ENTITY_ANOMALY_DEFAULT_LOOKBACK}`);
  const [end, setEnd] = useState<string>('now');
  const handleTimeChange = useCallback(({ start: s, end: e }: OnTimeChangeProps) => {
    setStart(s);
    setEnd(e);
  }, []);

  const timeRangeMs = useMemo(
    () => ({
      from: parseDateWithDefault(start, moment().subtract(30, 'days')).valueOf(),
      to: parseDateWithDefault(end, moment(), true).valueOf(),
    }),
    [start, end]
  );

  const anomalyOverview = useAnomalyOverview({
    entityId,
    entityType,
    from: timeRangeMs.from,
    to: timeRangeMs.to,
  });

  const uniqueTactics = useMemo(
    () => Object.keys(anomalyOverview.data?.tacticCounts ?? {}),
    [anomalyOverview]
  );

  const anomalySummary = useAnomalySummary({
    entityId,
    entityType,
    body: { from: timeRangeMs.from, to: timeRangeMs.to },
  });

  const {
    services: { ml },
  } = useKibana();
  const manageJobsHref = useMlManagementHref(ml, {
    page: ML_PAGES.ANOMALY_DETECTION_JOBS_MANAGE,
  });

  return (
    <>
      <EuiFlexGroup
        alignItems="center"
        justifyContent="spaceBetween"
        responsive={false}
        gutterSize="s"
      >
        <EuiFlexItem grow={false}>
          <EuiSuperDatePicker
            start={start}
            end={end}
            onTimeChange={handleTimeChange}
            showUpdateButton={false}
            compressed
            width="auto"
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButtonEmpty
            color="primary"
            size="s"
            iconType="external"
            iconSide="right"
            href={manageJobsHref}
            target="_blank"
            isDisabled={!manageJobsHref}
          >
            {ANOMALY_TIMELINE_V2_MANAGE_ML_JOBS}
          </EuiButtonEmpty>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size="m" />
      <>
        <EuiTitle size="xs">
          <h3>{ATTACK_CHAIN_V2_TITLE}</h3>
        </EuiTitle>
        <EuiSpacer size="m" />
        <EuiPanel
          color="plain"
          hasBorder
          paddingSize="none"
          css={css`
            padding: 16px 24px;
          `}
        >
          <MitreAttackChain
            triggeredTactics={uniqueTactics}
            anomalyCountByTactic={anomalyOverview?.data?.tacticCounts ?? {}}
            showLabels
          />
        </EuiPanel>
      </>

      <EuiSpacer size="l" />
      <AnomalyTabTimelineSection
        timeRangeMs={timeRangeMs}
        anomalies={anomalySummary.data?.anomalies ?? []}
      />
      <EuiSpacer size="l" />
      <AnomalyTabTableSection anomalies={anomalySummary.data?.anomalies ?? []} />
    </>
  );
};
