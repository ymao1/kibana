/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import { compact } from 'lodash';
import type {
  AlertInstanceState as State,
  AlertInstanceContext as Context,
  RuleAlertData as AlertData,
} from '../../../../../types';
import type { ActionReducerFn, ReducerOpts, RuleActionWithSummary } from '../../../types';

export const filterUnsupportedActions: ActionReducerFn<RuleActionWithSummary> = async <
  A extends AlertData,
  S extends State,
  C extends Context,
  G extends string,
  R extends string
>(
  opts: ReducerOpts<RuleActionWithSummary, A, S, C, G, R>
) => {
  return compact(
    opts.actions.map((action) => {
      if (!opts.context.canGetSummarizedAlerts && action.alertsFilter) {
        opts.context.logger.error(
          `Skipping action "${action.id}" for rule "${opts.context.ruleId}" because the rule type "${opts.context.ruleType}" does not support alert-as-data.`
        );
        return null;
      }

      return action;
    })
  );
};
