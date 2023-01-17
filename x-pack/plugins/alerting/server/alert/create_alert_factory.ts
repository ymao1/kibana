/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { Logger } from '@kbn/core/server';
import { cloneDeep } from 'lodash';
import { type CategorizeAlertTypes, categorizeAlerts } from '../lib';
import { AlertInstanceContext, AlertInstanceState } from '../types';
import { Alert, PublicAlert } from './alert';

export interface AlertFactory<
  State extends AlertInstanceState,
  Context extends AlertInstanceContext,
  ActionGroupIds extends string
> {
  create: (id: string) => PublicAlert<State, Context, ActionGroupIds>;
  alertLimit: {
    getValue: () => number;
    setLimitReached: (reached: boolean) => void;
    checkLimitUsage: () => void;
  };
  hasReachedAlertLimit: () => boolean;
  done: () => AlertFactoryDoneUtils<State, Context, ActionGroupIds>;
}

export type PublicAlertFactory<
  State extends AlertInstanceState,
  Context extends AlertInstanceContext,
  ActionGroupIds extends string
> = Pick<AlertFactory<State, Context, ActionGroupIds>, 'create' | 'done'> & {
  alertLimit: Pick<
    AlertFactory<State, Context, ActionGroupIds>['alertLimit'],
    'getValue' | 'setLimitReached'
  >;
};

export interface AlertFactoryDoneUtils<
  State extends AlertInstanceState,
  Context extends AlertInstanceContext,
  ActionGroupIds extends string
> {
  getRecoveredAlerts: () => Array<Alert<State, Context, ActionGroupIds>>;
}

export interface CreateAlertFactoryOpts<
  State extends AlertInstanceState,
  Context extends AlertInstanceContext
> {
  alerts: Record<string, Alert<State, Context>>;
  logger: Logger;
  maxAlerts: number;
  canSetRecoveryContext?: boolean;
}

export function createAlertFactory<
  State extends AlertInstanceState,
  Context extends AlertInstanceContext,
  ActionGroupIds extends string
>({
  alerts,
  logger,
  maxAlerts,
  canSetRecoveryContext = false,
}: CreateAlertFactoryOpts<State, Context>): AlertFactory<State, Context, ActionGroupIds> {
  // Keep track of which alerts we started with so we can determine which have recovered
  const originalAlerts = cloneDeep(alerts);

  // Number of alerts reported
  let numAlertsCreated = 0;

  // Whether the number of alerts reported has reached max allowed
  let hasReachedAlertLimit = false;

  // Whether rule type has asked for the alert limit
  let hasRequestedAlertLimit = false;

  // Whether rule type has reported back if alert limit was reached
  let hasReportedLimitReached = false;

  let isDone = false;
  return {
    create: (id: string): PublicAlert<State, Context, ActionGroupIds> => {
      if (isDone) {
        throw new Error(`Can't create new alerts after calling done() in AlertsFactory.`);
      }

      if (numAlertsCreated++ >= maxAlerts) {
        hasReachedAlertLimit = true;
        throw new Error(`Rule reported more than ${maxAlerts} alerts.`);
      }

      if (!alerts[id]) {
        alerts[id] = new Alert<State, Context>(id);
      }

      return alerts[id];
    },
    // namespace alert limit services for rule type executors to use
    alertLimit: {
      getValue: (): number => {
        hasRequestedAlertLimit = true;
        return maxAlerts;
      },
      setLimitReached: (reached: boolean) => {
        hasReportedLimitReached = true;
        hasReachedAlertLimit = reached;
      },
      checkLimitUsage: () => {
        // If the rule type has requested the value but never reported back, throw an error
        if (hasRequestedAlertLimit && !hasReportedLimitReached) {
          throw new Error(
            `Rule has not reported whether alert limit has been reached after requesting limit value!`
          );
        }
      },
    },
    hasReachedAlertLimit: (): boolean => hasReachedAlertLimit,
    done: (): AlertFactoryDoneUtils<State, Context, ActionGroupIds> => {
      isDone = true;
      return {
        getRecoveredAlerts: () => {
          if (!canSetRecoveryContext) {
            logger.debug(
              `Set doesSetRecoveryContext to true on rule type to get access to recovered alerts.`
            );
            return [];
          }

          const { recovered } = categorizeAlerts<
            Alert<State, Context, ActionGroupIds, ActionGroupIds>
          >({
            reportedAlerts: splitAlerts<State, Context>(alerts, originalAlerts),
            trackedAlerts: originalAlerts,
            hasReachedAlertLimit,
            alertLimit: maxAlerts,
          });
          return Object.keys(recovered ?? {}).map((alertId: string) => recovered[alertId]);
        },
      };
    },
  };
}

/**
 * Split reported alerts into reported active and reported recovered
 * based on whether or not actions have been scheduled for the alert
 *
 */
export function splitAlerts<State extends AlertInstanceState, Context extends AlertInstanceContext>(
  reportedAlerts: Record<string, Alert<State, Context>>,
  trackedActiveAlerts: Record<string, Alert<State, Context>>
): CategorizeAlertTypes<Alert<State, Context>> {
  const alerts: CategorizeAlertTypes<Alert<State, Context>> = {
    active: {},
    recovered: {},
  };

  for (const id in reportedAlerts) {
    if (reportedAlerts.hasOwnProperty(id)) {
      if (reportedAlerts[id].hasScheduledActions()) {
        alerts.active[id] = reportedAlerts[id];
      } else if (trackedActiveAlerts[id]) {
        alerts.recovered[id] = reportedAlerts[id];
      }
    }
  }

  return alerts;
}

export function getPublicAlertFactory<
  State extends AlertInstanceState = AlertInstanceState,
  Context extends AlertInstanceContext = AlertInstanceContext,
  ActionGroupIds extends string = string
>(
  alertFactory: AlertFactory<State, Context, ActionGroupIds>
): PublicAlertFactory<State, Context, ActionGroupIds> {
  return {
    create: (...args): PublicAlert<State, Context, ActionGroupIds> => alertFactory.create(...args),
    alertLimit: {
      getValue: (): number => alertFactory.alertLimit.getValue(),
      setLimitReached: (...args): void => alertFactory.alertLimit.setLimitReached(...args),
    },
    done: (): AlertFactoryDoneUtils<State, Context, ActionGroupIds> => alertFactory.done(),
  };
}
