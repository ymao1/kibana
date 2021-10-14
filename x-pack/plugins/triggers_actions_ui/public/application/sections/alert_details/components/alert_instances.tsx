/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useState } from 'react';
import moment, { Duration } from 'moment';
import { assign, fill } from 'lodash';
import { i18n } from '@kbn/i18n';
import {
  EuiBasicTable,
  EuiHealth,
  EuiSpacer,
  EuiToolTip,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHorizontalRule,
  EuiPanel,
  EuiStat,
  EuiEmptyPrompt,
  EuiIconTip,
  EuiTitle,
} from '@elastic/eui';
import { FormattedMessage } from '@kbn/i18n/react';
// @ts-ignore
import { RIGHT_ALIGNMENT, CENTER_ALIGNMENT } from '@elastic/eui/lib/services';
import { padStart, chunk } from 'lodash';
import { BarSeries, Chart, CurveType, LineSeries, Settings } from '@elastic/charts';
import {
  ActionGroup,
  AlertExecutionStatusErrorReasons,
  AlertInstanceStatusValues,
} from '../../../../../../alerting/common';
import {
  Alert,
  AlertInstanceSummary,
  AlertInstanceStatus,
  AlertType,
  Pagination,
} from '../../../../types';
import {
  ComponentOpts as AlertApis,
  withBulkAlertOperations,
} from '../../common/components/with_bulk_alert_api_operations';
import { DEFAULT_SEARCH_PAGE_SIZE } from '../../../constants';
import './alert_instances.scss';
import { RuleMutedSwitch } from './rule_muted_switch';
import { getHealthColor } from '../../alerts_list/components/alert_status_filter';
import {
  alertsStatusesTranslationsMapping,
  ALERT_STATUS_LICENSE_ERROR,
} from '../../alerts_list/translations';
import {
  formatMillisForDisplay,
  shouldShowDurationWarning,
} from '../../../lib/execution_duration_utils';

type AlertInstancesProps = {
  alert: Alert;
  alertType: AlertType;
  readOnly: boolean;
  alertInstanceSummary: AlertInstanceSummary;
  requestRefresh: () => Promise<void>;
  durationEpoch?: number;
} & Pick<AlertApis, 'muteAlertInstance' | 'unmuteAlertInstance'>;

const DESIRED_NUM_EXECUTION_DURATIONS = 30;

export const alertInstancesTableColumns = (
  onMuteAction: (instance: AlertInstanceListItem) => Promise<void>,
  readOnly: boolean
) => [
  {
    field: 'instance',
    name: i18n.translate(
      'xpack.triggersActionsUI.sections.alertDetails.alertInstancesList.columns.alert',
      { defaultMessage: 'Alert' }
    ),
    sortable: false,
    truncateText: true,
    width: '45%',
    'data-test-subj': 'alertInstancesTableCell-instance',
    render: (value: string) => {
      return (
        <EuiToolTip anchorClassName={'eui-textTruncate'} content={value}>
          <span>{value}</span>
        </EuiToolTip>
      );
    },
  },
  {
    field: 'status',
    name: i18n.translate(
      'xpack.triggersActionsUI.sections.alertDetails.alertInstancesList.columns.status',
      { defaultMessage: 'Status' }
    ),
    width: '15%',
    render: (value: AlertInstanceListItemStatus, instance: AlertInstanceListItem) => {
      return (
        <EuiHealth color={value.healthColor} className="actionsInstanceList__health">
          {value.label}
          {value.actionGroup ? ` (${value.actionGroup})` : ``}
        </EuiHealth>
      );
    },
    sortable: false,
    'data-test-subj': 'alertInstancesTableCell-status',
  },
  {
    field: 'start',
    width: '190px',
    render: (value: Date | undefined, instance: AlertInstanceListItem) => {
      return value ? moment(value).format('D MMM YYYY @ HH:mm:ss') : '';
    },
    name: i18n.translate(
      'xpack.triggersActionsUI.sections.alertDetails.alertInstancesList.columns.start',
      { defaultMessage: 'Start' }
    ),
    sortable: false,
    'data-test-subj': 'alertInstancesTableCell-start',
  },
  {
    field: 'duration',
    render: (value: number, instance: AlertInstanceListItem) => {
      return value ? durationAsString(moment.duration(value)) : '';
    },
    name: i18n.translate(
      'xpack.triggersActionsUI.sections.alertDetails.alertInstancesList.columns.duration',
      { defaultMessage: 'Duration' }
    ),
    sortable: false,
    width: '80px',
    'data-test-subj': 'alertInstancesTableCell-duration',
  },
  {
    field: '',
    align: RIGHT_ALIGNMENT,
    width: '60px',
    name: i18n.translate(
      'xpack.triggersActionsUI.sections.alertDetails.alertInstancesList.columns.mute',
      { defaultMessage: 'Mute' }
    ),
    render: (alertInstance: AlertInstanceListItem) => {
      return (
        <RuleMutedSwitch
          disabled={readOnly}
          onMuteAction={async () => await onMuteAction(alertInstance)}
          alertInstance={alertInstance}
        />
      );
    },
    sortable: false,
    'data-test-subj': 'alertInstancesTableCell-actions',
  },
];

function durationAsString(duration: Duration): string {
  return [duration.hours(), duration.minutes(), duration.seconds()]
    .map((value) => padStart(`${value}`, 2, '0'))
    .join(':');
}

export function AlertInstances({
  alert,
  alertType,
  readOnly,
  alertInstanceSummary,
  muteAlertInstance,
  unmuteAlertInstance,
  requestRefresh,
  durationEpoch = Date.now(),
}: AlertInstancesProps) {
  const [pagination, setPagination] = useState<Pagination>({
    index: 0,
    size: DEFAULT_SEARCH_PAGE_SIZE,
  });

  const alertInstances = Object.entries(alertInstanceSummary.instances)
    .map(([instanceId, instance]) =>
      alertInstanceToListItem(durationEpoch, alertType, instanceId, instance)
    )
    .sort((leftInstance, rightInstance) => leftInstance.sortPriority - rightInstance.sortPriority);

  const pageOfAlertInstances = getPage(alertInstances, pagination);

  const onMuteAction = async (instance: AlertInstanceListItem) => {
    await (instance.isMuted
      ? unmuteAlertInstance(alert, instance.instance)
      : muteAlertInstance(alert, instance.instance));
    requestRefresh();
  };

  const showDurationWarning = shouldShowDurationWarning(
    alertType,
    alertInstanceSummary.executionDuration.average
  );

  const paddedExecutionDurations = padOrTruncateDurations(
    alertInstanceSummary.executionDuration.values,
    DESIRED_NUM_EXECUTION_DURATIONS
  );

  const healthColor = getHealthColor(alert.executionStatus.status);
  const isLicenseError =
    alert.executionStatus.error?.reason === AlertExecutionStatusErrorReasons.License;
  const statusMessage = isLicenseError
    ? ALERT_STATUS_LICENSE_ERROR
    : alertsStatusesTranslationsMapping[alert.executionStatus.status];

  return (
    <>
      <EuiHorizontalRule />
      <EuiFlexGroup>
        <EuiFlexItem grow={false}>
          <EuiPanel color="subdued" hasBorder={false}>
            <EuiStat
              data-test-subj={`ruleStatus-${alert.executionStatus.status}`}
              title={
                <EuiHealth
                  data-test-subj={`ruleStatus-${alert.executionStatus.status}`}
                  textSize="inherit"
                  color={healthColor}
                >
                  {statusMessage}
                </EuiHealth>
              }
              description={i18n.translate(
                'xpack.triggersActionsUI.sections.alertDetails.alertInstancesList.ruleLastExecutionDescription',
                {
                  defaultMessage: `Last response`,
                }
              )}
            />
          </EuiPanel>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiPanel
            data-test-subj="avgExecutionDurationPanel"
            color={showDurationWarning ? 'warning' : 'subdued'}
            hasBorder={false}
          >
            <EuiStat
              data-test-subj="avgExecutionDurationStat"
              title={
                <EuiFlexGroup gutterSize="xs" className="ruleDurationStat">
                  {showDurationWarning && (
                    <EuiFlexItem grow={false}>
                      <EuiIconTip
                        data-test-subj="ruleDurationWarning"
                        anchorClassName="ruleDurationWarningIcon"
                        type="alert"
                        color="warning"
                        content={i18n.translate(
                          'xpack.triggersActionsUI.sections.alertDetails.alertInstancesList.ruleTypeExcessDurationMessage',
                          {
                            defaultMessage: `Duration exceeds the rule's expected run time.`,
                          }
                        )}
                        position="top"
                      />
                    </EuiFlexItem>
                  )}
                  <EuiFlexItem grow={false}>
                    {formatMillisForDisplay(alertInstanceSummary.executionDuration.average)}
                  </EuiFlexItem>
                </EuiFlexGroup>
              }
              description={i18n.translate(
                'xpack.triggersActionsUI.sections.alertDetails.alertInstancesList.avgDurationDescription',
                {
                  defaultMessage: `Average duration`,
                }
              )}
            />
          </EuiPanel>
        </EuiFlexItem>
        <EuiFlexItem grow={true}>
          <EuiPanel data-test-subj="executionDurationChartPanel" hasBorder={true}>
            <EuiFlexGroup gutterSize="xs">
              <EuiFlexItem grow={false}>
                <EuiTitle size="s">
                  <h4>
                    <FormattedMessage
                      id="xpack.triggersActionsUI.sections.alertDetails.alertInstancesList.recentDurationsTitle"
                      defaultMessage="Recent execution durations"
                    />
                  </h4>
                </EuiTitle>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiIconTip
                  anchorClassName="executionDurationChartTitleIcon"
                  color="subdued"
                  type="questionInCircle"
                  content={i18n.translate(
                    'xpack.triggersActionsUI.sections.alertDetails.alertInstancesList.recentDurationsTooltip',
                    {
                      defaultMessage: `Recent rule executions include up to the last {numExecutions} executions.`,
                      values: {
                        numExecutions: DESIRED_NUM_EXECUTION_DURATIONS,
                      },
                    }
                  )}
                  position="top"
                />
              </EuiFlexItem>
            </EuiFlexGroup>

            {alertInstanceSummary.executionDuration.values &&
            alertInstanceSummary.executionDuration.values.length > 0 ? (
              <>
                <Chart data-test-subj="executionDurationChart" size={{ height: 120 }}>
                  <Settings
                    theme={{
                      lineSeriesStyle: {
                        point: { visible: false },
                        line: { stroke: '#DD0A73' },
                      },
                    }}
                  />
                  <BarSeries
                    id="executionDuration"
                    xScaleType="linear"
                    yScaleType="linear"
                    xAccessor={0}
                    yAccessors={[1]}
                    data={paddedExecutionDurations.map((val, ndx) => [ndx, val])}
                  />
                  <LineSeries
                    id="rule_duration_avg"
                    xScaleType="linear"
                    yScaleType="linear"
                    xAccessor={0}
                    yAccessors={[1]}
                    data={paddedExecutionDurations.map((val, ndx) => [
                      ndx,
                      alertInstanceSummary.executionDuration.average,
                    ])}
                    curve={CurveType.CURVE_NATURAL}
                  />
                </Chart>
              </>
            ) : (
              <>
                <EuiEmptyPrompt
                  data-test-subj="executionDurationChartEmpty"
                  body={
                    <>
                      <p>
                        <FormattedMessage
                          id="xpack.triggersActionsUI.sections.alertDetails.alertInstancesList.executionDurationNoData"
                          defaultMessage="There are no available executions for this rule."
                        />
                      </p>
                    </>
                  }
                />
              </>
            )}
          </EuiPanel>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size="xl" />
      <input
        type="hidden"
        data-test-subj="alertInstancesDurationEpoch"
        name="alertInstancesDurationEpoch"
        value={durationEpoch}
      />
      <EuiBasicTable
        items={pageOfAlertInstances}
        pagination={{
          pageIndex: pagination.index,
          pageSize: pagination.size,
          totalItemCount: alertInstances.length,
        }}
        onChange={({ page: changedPage }: { page: Pagination }) => {
          setPagination(changedPage);
        }}
        rowProps={() => ({
          'data-test-subj': 'alert-instance-row',
        })}
        cellProps={() => ({
          'data-test-subj': 'cell',
        })}
        columns={alertInstancesTableColumns(onMuteAction, readOnly)}
        data-test-subj="alertInstancesList"
        tableLayout="fixed"
        className="alertInstancesList"
      />
    </>
  );
}
export const AlertInstancesWithApi = withBulkAlertOperations(AlertInstances);

function getPage(items: any[], pagination: Pagination) {
  return chunk(items, pagination.size)[pagination.index] || [];
}

interface AlertInstanceListItemStatus {
  label: string;
  healthColor: string;
  actionGroup?: string;
}
export interface AlertInstanceListItem {
  instance: string;
  status: AlertInstanceListItemStatus;
  start?: Date;
  duration: number;
  isMuted: boolean;
  sortPriority: number;
}

const ACTIVE_LABEL = i18n.translate(
  'xpack.triggersActionsUI.sections.alertDetails.alertInstancesList.status.active',
  { defaultMessage: 'Active' }
);

const INACTIVE_LABEL = i18n.translate(
  'xpack.triggersActionsUI.sections.alertDetails.alertInstancesList.status.inactive',
  { defaultMessage: 'Recovered' }
);

function getActionGroupName(alertType: AlertType, actionGroupId?: string): string | undefined {
  actionGroupId = actionGroupId || alertType.defaultActionGroupId;
  const actionGroup = alertType?.actionGroups?.find(
    (group: ActionGroup<string>) => group.id === actionGroupId
  );
  return actionGroup?.name;
}

export function alertInstanceToListItem(
  durationEpoch: number,
  alertType: AlertType,
  instanceId: string,
  instance: AlertInstanceStatus
): AlertInstanceListItem {
  const isMuted = !!instance?.muted;
  const status =
    instance?.status === 'Active'
      ? {
          label: ACTIVE_LABEL,
          actionGroup: getActionGroupName(alertType, instance?.actionGroupId),
          healthColor: 'primary',
        }
      : { label: INACTIVE_LABEL, healthColor: 'subdued' };
  const start = instance?.activeStartDate ? new Date(instance.activeStartDate) : undefined;
  const duration = start ? durationEpoch - start.valueOf() : 0;
  const sortPriority = getSortPriorityByStatus(instance?.status);
  return {
    instance: instanceId,
    status,
    start,
    duration,
    isMuted,
    sortPriority,
  };
}

function getSortPriorityByStatus(status?: AlertInstanceStatusValues): number {
  switch (status) {
    case 'Active':
      return 0;
    case 'OK':
      return 1;
  }
  return 2;
}

export function padOrTruncateDurations(values: number[], desiredSize: number) {
  if (values.length === desiredSize) {
    return values;
  } else if (values.length < desiredSize) {
    return assign(fill(new Array(desiredSize), 0), values);
  } else {
    // oldest durations are at the start of the array, so take the last {desiredSize} values
    return values.slice(-desiredSize);
  }
}
