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
import type { ActionReducerFn, ReducerOpts, RuleActionWithSummary } from '../../../types';
import { isSummaryActionThrottled } from '../../../lib';

export const filterThrottled: ActionReducerFn<RuleActionWithSummary> = async <
  A extends AlertData,
  S extends State,
  C extends Context,
  G extends string,
  R extends string
>(
  opts: ReducerOpts<RuleActionWithSummary, A, S, C, G, R>
) => {
  return opts.actions.filter(
    (action) =>
      !isSummaryActionThrottled({
        action,
        throttledSummaryActions: opts.context.throttledSummaryActions,
        logger: opts.context.logger,
      })
  );
};
