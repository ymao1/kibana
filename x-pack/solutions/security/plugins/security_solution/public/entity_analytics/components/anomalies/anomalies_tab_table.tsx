/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useCallback, useMemo, useState } from 'react';
import type { CriteriaWithPagination, EuiBasicTableColumn, PropertySort } from '@elastic/eui';
import {
  EuiBadge,
  EuiButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiInMemoryTable,
  EuiSpacer,
  EuiText,
  EuiTitle,
  EuiToolTip,
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n-react';
import { css } from '@emotion/react';
import { PreferenceFormattedDate } from '../../../common/components/formatted_date';
import type { AnomalySummaryEntry } from '../../../../common/api/entity_analytics';

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 25, 50];

interface TableRow {
  id: string;
  jobId: string;
  jobDisplayName: string;
  mitreTactics: string[];
  timestamp: number;
  baseline: string;
  anomaly: string;
  anomalyScore: number;
  description: string;
}

const mapToRow = (entry: AnomalySummaryEntry, index: number): TableRow => {
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
    baseline,
    anomaly,
    anomalyScore: entry.recordScore,
    description,
  };
};

const truncatedAnchorCss = css`
  display: block;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

interface AnomalyTabTableSectionProps {
  anomalies: AnomalySummaryEntry[];
}

export const AnomalyTabTableSection: React.FC<AnomalyTabTableSectionProps> = ({ anomalies }) => {
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [expandedRowIds, setExpandedRowIds] = useState<Set<string>>(() => new Set());

  const rows = useMemo(() => anomalies.map(mapToRow), [anomalies]);

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
      {
        align: 'center' as const,
        width: '32px',
        isExpander: true,
        name: '',
        render: (item: TableRow) => {
          const isExpanded = expandedRowIds.has(item.id);
          const label = isExpanded
            ? i18n.translate('xpack.securitySolution.entityAnalytics.anomaliesTable.collapseRow', {
                defaultMessage: 'Collapse row',
              })
            : i18n.translate('xpack.securitySolution.entityAnalytics.anomaliesTable.expandRow', {
                defaultMessage: 'Expand row',
              });
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
      {
        name: i18n.translate('xpack.securitySolution.entityAnalytics.anomaliesTable.jobColumn', {
          defaultMessage: 'ML job',
        }),
        field: 'jobDisplayName',
        sortable: true,
        render: (jobDisplayName: string) => (
          <EuiToolTip content={jobDisplayName} anchorProps={{ css: truncatedAnchorCss }}>
            <EuiText size="xs" component="span" tabIndex={0}>
              {jobDisplayName}
            </EuiText>
          </EuiToolTip>
        ),
      },
      {
        name: i18n.translate('xpack.securitySolution.entityAnalytics.anomaliesTable.tacticColumn', {
          defaultMessage: 'Tactic',
        }),
        field: 'mitreTactics',
        render: (tactics: string[]) => (
          <EuiFlexGroup gutterSize="xs" wrap responsive={false}>
            {tactics.map((tactic) => (
              <EuiFlexItem key={tactic} grow={false}>
                <EuiBadge color="hollow">{tactic}</EuiBadge>
              </EuiFlexItem>
            ))}
          </EuiFlexGroup>
        ),
      },
      {
        name: i18n.translate(
          'xpack.securitySolution.entityAnalytics.anomaliesTable.timestampColumn',
          { defaultMessage: 'Timestamp' }
        ),
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
      {
        name: i18n.translate(
          'xpack.securitySolution.entityAnalytics.anomaliesTable.baselineColumn',
          { defaultMessage: 'Baseline' }
        ),
        render: (item: TableRow) => (
          <EuiToolTip content={item.baseline} anchorProps={{ css: truncatedAnchorCss }}>
            <EuiText size="xs" component="span" tabIndex={0}>
              {item.baseline}
            </EuiText>
          </EuiToolTip>
        ),
      },
      {
        name: i18n.translate(
          'xpack.securitySolution.entityAnalytics.anomaliesTable.anomalyColumn',
          { defaultMessage: 'Anomaly' }
        ),
        render: (item: TableRow) => (
          <EuiToolTip content={item.anomaly} anchorProps={{ css: truncatedAnchorCss }}>
            <EuiText size="xs" component="span" tabIndex={0}>
              {item.anomaly}
            </EuiText>
          </EuiToolTip>
        ),
      },
      {
        name: i18n.translate('xpack.securitySolution.entityAnalytics.anomaliesTable.scoreColumn', {
          defaultMessage: 'Anomaly score',
        }),
        field: 'anomalyScore',
        sortable: true,
        width: '120px',
        render: (score: number) => (
          <EuiBadge color={score >= 75 ? 'danger' : score >= 50 ? 'warning' : 'default'}>
            {Math.round(score)}
          </EuiBadge>
        ),
      },
    ],
    [expandedRowIds, toggleRowExpanded]
  );

  const itemIdToExpandedRowMap = useMemo(() => {
    const map: Record<string, React.ReactNode> = {};
    for (const row of rows.filter((r) => expandedRowIds.has(r.id))) {
      map[row.id] = (
        <div>
          <EuiText size="xs">
            <strong>
              {i18n.translate(
                'xpack.securitySolution.entityAnalytics.anomaliesTable.descriptionHeading',
                { defaultMessage: 'Description' }
              )}
            </strong>
          </EuiText>
          <EuiSpacer size="xs" />
          <EuiText size="xs">{row.description}</EuiText>
        </div>
      );
    }
    return map;
  }, [expandedRowIds, rows]);

  const sorting = useMemo<{ sort: PropertySort }>(
    () => ({ sort: { field: 'timestamp', direction: 'desc' } }),
    []
  );

  const pagination = useMemo(
    () => ({ initialPageSize: DEFAULT_PAGE_SIZE, pageSizeOptions: PAGE_SIZE_OPTIONS }),
    []
  );

  const handleTableChange = useCallback(({ page }: CriteriaWithPagination<TableRow>) => {
    setPageIndex(page.index);
    setPageSize(page.size);
  }, []);

  const from = rows.length > 0 ? pageIndex * pageSize + 1 : 0;
  const to = Math.min((pageIndex + 1) * pageSize, rows.length);

  return (
    <div>
      <EuiTitle size="xs">
        <h3>
          {i18n.translate('xpack.securitySolution.entityAnalytics.anomaliesTable.title', {
            defaultMessage: 'Anomalies',
          })}
        </h3>
      </EuiTitle>
      <EuiSpacer size="m" />
      <EuiText size="xs">
        <FormattedMessage
          id="xpack.securitySolution.entityAnalytics.anomaliesTable.showing"
          defaultMessage="Showing {from}-{to} of {total} anomalies"
          values={{
            from: <strong>{from}</strong>,
            to: <strong>{to}</strong>,
            total: <strong>{rows.length}</strong>,
          }}
        />
      </EuiText>
      <EuiSpacer size="s" />
      <EuiInMemoryTable
        tableCaption={i18n.translate(
          'xpack.securitySolution.entityAnalytics.anomaliesTable.caption',
          { defaultMessage: 'Anomaly records' }
        )}
        items={rows}
        itemId="id"
        columns={columns}
        sorting={sorting}
        pagination={pagination}
        onTableChange={handleTableChange}
        compressed
        itemIdToExpandedRowMap={itemIdToExpandedRowMap}
      />
    </div>
  );
};
