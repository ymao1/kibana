/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useCallback, useMemo, useState } from 'react';
import type { Criteria, EuiBasicTableColumn, EuiTableSortingType } from '@elastic/eui';
import {
  EuiBadge,
  EuiBasicTable,
  EuiButtonIcon,
  EuiSpacer,
  EuiText,
  EuiTitle,
  EuiToolTip,
  useEuiTheme,
} from '@elastic/eui';
import { FormattedMessage } from '@kbn/i18n-react';
import type { TableSortDirection, TableSortField } from './table/constants';
import {
  PAGE_SIZE_OPTIONS,
  SORT_FIELD_TO_API,
  SORT_FIELD_TO_TABLE,
  truncatedAnchorCss,
} from './table/constants';
import { PreferenceFormattedDate } from '../../../common/components/formatted_date';
import type { AnomalySummaryEntry } from '../../../../common/api/entity_analytics';
import {
  ENTITY_ANOMALY_TABLE_ANOMALY_COLUMN,
  ENTITY_ANOMALY_TABLE_BASELINE_COLUMN,
  ENTITY_ANOMALY_TABLE_CAPTION,
  ENTITY_ANOMALY_TABLE_COLLAPSE_ROW_TOOLTIP,
  ENTITY_ANOMALY_TABLE_DESCRIPTION,
  ENTITY_ANOMALY_TABLE_EXPAND_ROW_TOOLTIP,
  ENTITY_ANOMALY_TABLE_JOB_COLUMN,
  ENTITY_ANOMALY_TABLE_SCORE_COLUMN,
  ENTITY_ANOMALY_TABLE_TACTIC_COLUMN,
  ENTITY_ANOMALY_TABLE_TIMESTAMP_COLUMN,
  ENTITY_ANOMALY_TABLE_TITLE,
} from './translations';
import type { TableRow } from './table/types';
import { AnomalyJobName } from './table/anomaly_job_name';
import { AnomalyTacticBadges } from './table/anomaly_tactic_badges';
import { mapSummaryToRow } from './table/map_summary_to_row';

export interface TableChangeEvent {
  page?: { index: number; size: number };
  sort?: { field: TableSortField; direction: TableSortDirection };
}

interface AnomalyTabTableSectionProps {
  anomalies: AnomalySummaryEntry[];
  onTableChange: (event: TableChangeEvent) => void;
  page: number;
  pageSize: number;
  sortField: TableSortField;
  sortDirection: TableSortDirection;
  timeRange: { from: string; to: string };
  total: number;
}

export const AnomalyTabTableSection: React.FC<AnomalyTabTableSectionProps> = ({
  anomalies,
  onTableChange,
  page,
  pageSize,
  sortField,
  sortDirection,
  timeRange,
  total,
}) => {
  const { euiTheme } = useEuiTheme();
  const [expandedRowIds, setExpandedRowIds] = useState<Set<string>>(() => new Set());

  const rows = useMemo(() => anomalies.map(mapSummaryToRow), [anomalies]);

  const toggleRowExpanded = useCallback((id: string) => {
    setExpandedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const columns: Array<EuiBasicTableColumn<TableRow>> = useMemo(
    () => [
      // Expander column
      {
        align: 'center' as const,
        width: '32px',
        isExpander: true,
        name: '',
        render: (item: TableRow) => {
          const isExpanded = expandedRowIds.has(item.id);
          const label = isExpanded
            ? ENTITY_ANOMALY_TABLE_COLLAPSE_ROW_TOOLTIP
            : ENTITY_ANOMALY_TABLE_EXPAND_ROW_TOOLTIP;
          return (
            <EuiToolTip content={label} disableScreenReaderOutput>
              <EuiButtonIcon
                aria-label={label}
                aria-expanded={isExpanded}
                iconType={isExpanded ? 'arrowDown' : 'arrowRight'}
                color="text"
                onClick={() => toggleRowExpanded(item.id)}
              />
            </EuiToolTip>
          );
        },
      },
      // ML job column
      {
        name: ENTITY_ANOMALY_TABLE_JOB_COLUMN,
        field: 'jobDisplayName',
        sortable: true,
        render: (_: string, item: TableRow) => <AnomalyJobName row={item} timeRange={timeRange} />,
      },
      // Tactic column
      {
        name: ENTITY_ANOMALY_TABLE_TACTIC_COLUMN,
        field: 'mitreTactics',
        render: (tactics: string[]) => <AnomalyTacticBadges tactics={tactics} />,
      },
      // Timestamp column
      {
        name: ENTITY_ANOMALY_TABLE_TIMESTAMP_COLUMN,
        field: 'timestamp',
        sortable: true,
        render: (timestamp: number) => (
          <EuiToolTip
            content={<PreferenceFormattedDate value={new Date(timestamp)} />}
            anchorProps={{ css: truncatedAnchorCss }}
          >
            <EuiText size="xs" component="span" tabIndex={0}>
              <PreferenceFormattedDate value={new Date(timestamp)} />
            </EuiText>
          </EuiToolTip>
        ),
      },
      // Baseline column
      {
        name: ENTITY_ANOMALY_TABLE_BASELINE_COLUMN,
        render: (item: TableRow) => (
          <EuiToolTip content={item.baseline} anchorProps={{ css: truncatedAnchorCss }}>
            <EuiText size="xs" component="span" tabIndex={0}>
              {item.baseline}
            </EuiText>
          </EuiToolTip>
        ),
      },
      // Anomaly column
      {
        name: ENTITY_ANOMALY_TABLE_ANOMALY_COLUMN,
        render: (item: TableRow) => (
          <EuiToolTip content={item.anomaly} anchorProps={{ css: truncatedAnchorCss }}>
            <EuiText size="xs" component="span" tabIndex={0}>
              {item.anomaly}
            </EuiText>
          </EuiToolTip>
        ),
      },
      // Anomaly score column
      {
        name: ENTITY_ANOMALY_TABLE_SCORE_COLUMN,
        field: 'anomalyScore',
        sortable: true,
        width: '120px',
        render: (score: number) => {
          const { severity } = euiTheme.colors;
          const color =
            score >= 75
              ? severity.danger
              : score >= 50
              ? severity.risk
              : score >= 25
              ? severity.warning
              : score >= 3
              ? severity.neutral
              : severity.unknown;
          return <EuiBadge color={color}>{Math.round(score)}</EuiBadge>;
        },
      },
    ],
    [euiTheme, expandedRowIds, timeRange, toggleRowExpanded]
  );

  const itemIdToExpandedRowMap = useMemo(() => {
    const map: Record<string, React.ReactNode> = {};
    for (const row of rows.filter((r) => expandedRowIds.has(r.id))) {
      map[row.id] = (
        <div>
          <EuiText size="xs">
            <strong>{ENTITY_ANOMALY_TABLE_DESCRIPTION}</strong>
          </EuiText>
          <EuiSpacer size="xs" />
          <EuiText size="xs">{row.description}</EuiText>
        </div>
      );
    }
    return map;
  }, [expandedRowIds, rows]);

  const pagination = useMemo(
    () => ({
      pageIndex: page - 1,
      pageSize,
      totalItemCount: total,
      pageSizeOptions: PAGE_SIZE_OPTIONS,
    }),
    [page, pageSize, total]
  );

  const sorting = useMemo<EuiTableSortingType<TableRow>>(
    () => ({
      sort: { field: SORT_FIELD_TO_TABLE[sortField], direction: sortDirection },
    }),
    [sortField, sortDirection]
  );

  const handleChange = useCallback(
    ({ page: pageChange, sort }: Criteria<TableRow>) => {
      const event: TableChangeEvent = {};
      if (pageChange) event.page = { index: pageChange.index, size: pageChange.size };
      if (sort) {
        const apiField = SORT_FIELD_TO_API[sort.field as keyof TableRow];
        if (apiField) event.sort = { field: apiField, direction: sort.direction };
      }
      onTableChange(event);
    },
    [onTableChange]
  );

  const from = total > 0 ? (page - 1) * pageSize + 1 : 0;
  const to = Math.min(page * pageSize, total);

  return (
    <div>
      <EuiTitle size="xs">
        <h3>{ENTITY_ANOMALY_TABLE_TITLE}</h3>
      </EuiTitle>
      <EuiSpacer size="m" />
      <EuiText size="xs">
        <FormattedMessage
          id="xpack.securitySolution.entityAnalytics.entityAnomalies.tab.page"
          defaultMessage="Showing {from}-{to} of {total} anomalies"
          values={{
            from: <strong>{from}</strong>,
            to: <strong>{to}</strong>,
            total: <strong>{total}</strong>,
          }}
        />
      </EuiText>
      <EuiSpacer size="s" />
      <EuiBasicTable
        tableCaption={ENTITY_ANOMALY_TABLE_CAPTION}
        items={rows}
        itemId="id"
        columns={columns}
        sorting={sorting}
        pagination={pagination}
        onChange={handleChange}
        compressed
        itemIdToExpandedRowMap={itemIdToExpandedRowMap}
      />
    </div>
  );
};
