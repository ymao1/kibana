/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import type {
  AlertInstanceState as State,
  AlertInstanceContext as Context,
  RuleAlertData as AlertData,
} from '../../../../../types';
import { logNumberOfFilteredAlerts } from '../../../lib';
import type { ActionReducerFn, ReducerOpts, RuleActionWithSummary } from '../../../types';

export const logActions: ActionReducerFn<RuleActionWithSummary> = async <
  A extends AlertData,
  S extends State,
  C extends Context,
  G extends string,
  R extends string
>(
  opts: ReducerOpts<RuleActionWithSummary, A, S, C, G, R>
) => {
  opts.actions.forEach((action) => {
    if (action.summarizedAlerts) {
      logNumberOfFilteredAlerts({
        logger: opts.context.logger,
        numberOfAlerts: opts.context.numAlerts,
        numberOfSummarizedAlerts: action.summarizedAlerts.all.count,
        action,
      });
    }
  });
  return opts.actions;
};
