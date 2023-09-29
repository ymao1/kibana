/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import deepmerge from 'deepmerge';
import { get } from 'lodash';
import type { Alert } from '@kbn/alerts-as-data-utils';
import {
  ALERT_ACTION_GROUP,
  ALERT_DURATION,
  ALERT_FLAPPING,
  ALERT_FLAPPING_HISTORY,
  ALERT_MAINTENANCE_WINDOW_IDS,
  ALERT_RULE_TAGS,
  ALERT_TIME_RANGE,
  EVENT_ACTION,
  SPACE_IDS,
  TAGS,
  TIMESTAMP,
  VERSION,
} from '@kbn/rule-data-utils';
import { DeepPartial } from '@kbn/utility-types';
import { Alert as LegacyAlert } from '../../alert/alert';
import { AlertInstanceContext, AlertInstanceState, RuleAlertData } from '../../types';
import type { AlertRule } from '../types';
import { stripFrameworkFields } from './strip_framework_fields';
import { removeUnflattenedFieldsFromAlert } from './format_alert';
import { REFRESH_FIELDS_ALL } from './alert_conflict_resolver';

interface BuildOngoingAlertOpts<
  AlertData extends RuleAlertData,
  LegacyState extends AlertInstanceState,
  LegacyContext extends AlertInstanceContext,
  ActionGroupIds extends string,
  RecoveryActionGroupId extends string
> {
  alert: Alert & AlertData;
  legacyAlert: LegacyAlert<LegacyState, LegacyContext, ActionGroupIds | RecoveryActionGroupId>;
  rule: AlertRule;
  payload?: DeepPartial<AlertData>;
  timestamp: string;
  kibanaVersion: string;
}

/**
 * Updates an existing alert document with data from the LegacyAlert class
 * Currently only populates framework fields and not any rule type specific fields
 */

export const buildOngoingAlert = <
  AlertData extends RuleAlertData,
  LegacyState extends AlertInstanceState,
  LegacyContext extends AlertInstanceContext,
  ActionGroupIds extends string,
  RecoveryActionGroupId extends string
>({
  alert,
  legacyAlert,
  payload,
  rule,
  timestamp,
  kibanaVersion,
}: BuildOngoingAlertOpts<
  AlertData,
  LegacyState,
  LegacyContext,
  ActionGroupIds,
  RecoveryActionGroupId
>): Alert & AlertData => {
  const cleanedPayload = stripFrameworkFields(payload);
  const refreshableAlertFields = REFRESH_FIELDS_ALL.reduce<Record<string, string | string[]>>(
    (acc: Record<string, string | string[]>, currField) => {
      const value = get(alert, currField);
      if (null != value) {
        acc[currField] = value;
      }
      return acc;
    },
    {}
  );
  const alertUpdates = {
    // Set latest rule configuration
    ...rule,
    // Update the timestamp to reflect latest update time
    [TIMESTAMP]: timestamp,
    [EVENT_ACTION]: 'active',
    // Because we're building this alert after the action execution handler has been
    // run, the scheduledExecutionOptions for the alert has been cleared and
    // the lastScheduledActions has been set. If we ever change the order of operations
    // to build and persist the alert before action execution handler, we will need to
    // update where we pull the action group from.
    // Set latest action group as this may have changed during execution (ex: error -> warning)
    [ALERT_ACTION_GROUP]: legacyAlert.getScheduledActionOptions()?.actionGroup,
    // Set latest flapping state
    [ALERT_FLAPPING]: legacyAlert.getFlapping(),
    // Set latest flapping_history
    [ALERT_FLAPPING_HISTORY]: legacyAlert.getFlappingHistory(),
    // Set latest maintenance window IDs
    [ALERT_MAINTENANCE_WINDOW_IDS]: legacyAlert.getMaintenanceWindowIds(),
    // Set the time range
    ...(legacyAlert.getState().start
      ? {
          [ALERT_TIME_RANGE]: { gte: legacyAlert.getState().start },
        }
      : {}),
    // Set latest duration as ongoing alerts should have updated duration
    ...(legacyAlert.getState().duration
      ? { [ALERT_DURATION]: legacyAlert.getState().duration }
      : {}),
    [SPACE_IDS]: rule[SPACE_IDS],
    [VERSION]: kibanaVersion,
    [TAGS]: Array.from(
      new Set([
        ...((cleanedPayload?.tags as string[]) ?? []),
        ...(alert.tags ?? []),
        ...(rule[ALERT_RULE_TAGS] ?? []),
      ])
    ),
  };
  const formattedAlert = removeUnflattenedFieldsFromAlert(alert, {
    ...cleanedPayload,
    ...alertUpdates,
    ...refreshableAlertFields,
  });
  return deepmerge.all([formattedAlert, cleanedPayload, alertUpdates], {
    arrayMerge: (_, sourceArray) => sourceArray,
  }) as Alert & AlertData;
};
