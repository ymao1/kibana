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
} from '../../../../types';

export const filterSummarizedAlerts: AlertReducerFn = async <
  S extends State,
  C extends Context,
  G extends string,
  R extends string
>(
  opts: ReducerOpts<S, C, G, R>
) => {
  opts.context.logger.info(`Filtering out alerts that do not exist in the alert summary`);

  return opts.alerts.filter(({ alert }) => {
    if (alert.isFilteredOut(opts.context.action.summarizedAlerts ?? null)) {
      return false;
    }

    return true;
  });
};
