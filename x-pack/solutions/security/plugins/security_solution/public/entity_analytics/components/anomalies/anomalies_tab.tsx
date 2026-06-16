/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  EuiBadge,
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
import {
  ENTITY_ANOMALIES_TAB_MANAGE_ML_JOBS,
  ENTITY_ANOMALIES_TAB_ATTACK_CHAIN_TITLE,
  ENTITY_ANOMALIES_CLEAR_TACTIC_LABEL,
  getEntityAnomaliesFilteredByTacticLabel,
} from './translations';
import { useAnomalySummary } from '../../api/hooks/use_anomaly_summary';
import { MitreAttackChain } from './mitre/components/mitre_attack_chain';
import { AnomalyTabTimelineSection } from './anomalies_tab_timeline';
import type { TableChangeEvent } from './anomalies_tab_table';
import { AnomalyTabTableSection } from './anomalies_tab_table';
import type { TableSortDirection, TableSortField } from './table/constants';
import {
  DEFAULT_SORT_DIRECTION,
  DEFAULT_SORT_FIELD,
  DEFAULT_TABLE_PAGE_SIZE,
} from './table/constants';

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
      from: parseDateWithDefault(
        start,
        moment().subtract(ENTITY_ANOMALY_DEFAULT_LOOKBACK, 'days')
      ).valueOf(),
      to: parseDateWithDefault(end, moment(), true).valueOf(),
    }),
    [start, end]
  );

  // TODO derive bucket interval based on time range and entity anomaly count once swimlane supports it
  // const bucketInterval = useMemo(() => deriveBucketInterval(timeRangeMs), [timeRangeMs]);

  const [tablePageIndex, setTablePageIndex] = useState(0);
  const [tablePageSize, setTablePageSize] = useState(DEFAULT_TABLE_PAGE_SIZE);
  const [tableSortField, setTableSortField] = useState<TableSortField>(DEFAULT_SORT_FIELD);
  const [tableSortDirection, setTableSortDirection] =
    useState<TableSortDirection>(DEFAULT_SORT_DIRECTION);

  // Reset to page 1 whenever the time range changes.
  useEffect(() => {
    setTablePageIndex(0);
  }, [timeRangeMs]);

  const handleTableChange = useCallback(({ page, sort }: TableChangeEvent) => {
    if (page) {
      setTablePageIndex(page.index);
      setTablePageSize(page.size);
    }
    if (sort) {
      setTableSortField(sort.field);
      setTableSortDirection(sort.direction);
    }
  }, []);

  const [selectedTactic, setSelectedTactic] = useState<string | null>(null);

  const handleSelectTactic = useCallback(
    (tactic: string) => {
      setSelectedTactic((current) => (current === tactic ? null : tactic));
    },
    [setSelectedTactic]
  );

  const handleClearTactic = useCallback(() => {
    setSelectedTactic(null);
  }, [setSelectedTactic]);

  // TODO pass bucket interval to swimlane once supported, currently using fixed 1 day interval
  const anomalyOverview = useAnomalyOverview({
    entityId,
    entityType,
    from: timeRangeMs.from,
    to: timeRangeMs.to,
    threatTactics: selectedTactic ? [selectedTactic] : undefined,
  });

  const uniqueTactics = useMemo(
    () => Object.keys(anomalyOverview.data?.tacticCounts ?? {}),
    [anomalyOverview]
  );

  const anomalySummary = useAnomalySummary({
    entityId,
    entityType,
    body: {
      from: timeRangeMs.from,
      to: timeRangeMs.to,
      threat_tactics: selectedTactic ? [selectedTactic] : undefined,
      page: tablePageIndex + 1,
      page_size: tablePageSize,
      sort: [{ field: tableSortField, order: tableSortDirection }],
    },
  });

  useEffect(() => {
    if (anomalyOverview.isFetching) return;
    if (selectedTactic && !uniqueTactics.includes(selectedTactic)) {
      setSelectedTactic(null);
    }
  }, [anomalyOverview.isFetching, selectedTactic, uniqueTactics]);

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
            {ENTITY_ANOMALIES_TAB_MANAGE_ML_JOBS}
          </EuiButtonEmpty>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size="m" />
      <>
        <EuiTitle size="xs">
          <h3>{ENTITY_ANOMALIES_TAB_ATTACK_CHAIN_TITLE}</h3>
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
            anomalyCountByTactic={anomalyOverview?.data?.tacticCounts ?? {}}
            onSelectTactic={handleSelectTactic}
            selectedTactic={selectedTactic}
            triggeredTactics={uniqueTactics}
            showLabels
          />
        </EuiPanel>
      </>

      <EuiSpacer size="l" />

      {selectedTactic && (
        <>
          <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
            <EuiFlexItem grow={false}>
              <EuiBadge
                color="hollow"
                iconType="cross"
                iconSide="right"
                iconOnClick={handleClearTactic}
                iconOnClickAriaLabel={ENTITY_ANOMALIES_CLEAR_TACTIC_LABEL}
              >
                {getEntityAnomaliesFilteredByTacticLabel(selectedTactic)}
              </EuiBadge>
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiSpacer size="m" />
        </>
      )}

      <AnomalyTabTimelineSection
        anomalies={anomalyOverview.data?.anomalies ?? []}
        selectedTactic={selectedTactic}
        timeRangeMs={timeRangeMs}
      />
      <EuiSpacer size="l" />
      <AnomalyTabTableSection
        anomalies={anomalySummary.data?.anomalies ?? []}
        onTableChange={handleTableChange}
        page={anomalySummary.data?.page ?? tablePageIndex + 1}
        pageSize={anomalySummary.data?.page_size ?? tablePageSize}
        sortField={tableSortField}
        sortDirection={tableSortDirection}
        timeRange={{ from: start, to: end }}
        total={anomalySummary.data?.total ?? 0}
      />
    </>
  );
};
