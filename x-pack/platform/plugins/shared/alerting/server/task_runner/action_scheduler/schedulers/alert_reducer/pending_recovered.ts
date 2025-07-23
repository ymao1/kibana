/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { AlertReducerFn, ReducerOpts } from '.';
import {
  type AlertInstanceState as State,
  type AlertInstanceContext as Context,
  RuleNotifyWhen,
} from '../../../../types';

export const filterPendingRecovered: AlertReducerFn = async <
  S extends State,
  C extends Context,
  G extends string,
  R extends string
>(
  opts: ReducerOpts<S, C, G, R>
) => {
  opts.context.logger.info(
    `Filtering out alerts with pending recovered count when notifyWhen is not on status change`
  );

  return opts.alerts.filter(({ alert }) => {
    if (
      alert.getPendingRecoveredCount() > 0 &&
      opts.context.action?.frequency?.notifyWhen !== RuleNotifyWhen.CHANGE
    ) {
      return false;
    }

    return true;
  });
};
