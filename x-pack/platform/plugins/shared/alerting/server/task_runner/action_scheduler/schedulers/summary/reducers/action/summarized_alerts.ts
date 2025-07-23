/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import { asyncForEach } from '@kbn/std';
import type {
  AlertInstanceState as State,
  AlertInstanceContext as Context,
  RuleAlertData as AlertData,
} from '../../../../../types';
import { parseDuration } from '../../../../../../common';
import type { GetSummarizedAlertsParams } from '../../../../../alerts_client/types';
import { getSummarizedAlerts, isActionOnInterval, logNumberOfFilteredAlerts } from '../../../lib';
import type { ActionReducerFn, ReducerOpts, RuleActionWithSummary } from '../../../types';

export const enrichWithSummarizedAlerts: ActionReducerFn<RuleActionWithSummary> = async <
  A extends AlertData,
  S extends State,
  C extends Context,
  G extends string,
  R extends string
>(
  opts: ReducerOpts<RuleActionWithSummary, A, S, C, G, R>
) => {
  const actions = opts.actions;
  await asyncForEach(actions, async (action) => {
    const actionHasThrottleInterval = isActionOnInterval(action);
    // query for summarized alerts and add them to the action
    const optionsBase = {
      spaceId: opts.context.spaceId,
      ruleId: opts.context.ruleId,
      excludedAlertInstanceIds: opts.context.mutedAlertIds,
      alertsFilter: action.alertsFilter,
    };

    let options: GetSummarizedAlertsParams;
    if (actionHasThrottleInterval) {
      const throttleMills = parseDuration(action.frequency!.throttle!);
      const start = new Date(Date.now() - throttleMills);
      options = { ...optionsBase, start, end: new Date() };
    } else {
      options = { ...optionsBase, executionUuid: opts.context.executionUuid };
    }

    action.summarizedAlerts = await getSummarizedAlerts({
      queryOptions: options,
      alertsClient: opts.context.alertsClient,
    });

    if (!actionHasThrottleInterval) {
      logNumberOfFilteredAlerts({
        logger: opts.context.logger,
        numberOfAlerts: opts.context.numAlerts,
        numberOfSummarizedAlerts: action.summarizedAlerts.all.count,
        action,
      });
    }
  });
  return actions.filter((action) => (action?.summarizedAlerts?.all.count ?? 0) > 0);
};
