/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { AlertReducerFn, ReducerOpts } from '.';
import type {
  AlertInstanceState as State,
  AlertInstanceContext as Context,
} from '../../../../types';

export const filterActiveMaintenanceWindows: AlertReducerFn = async <
  S extends State,
  C extends Context,
  G extends string,
  R extends string
>(
  opts: ReducerOpts<S, C, G, R>
) => {
  opts.context.logger.info(`Filtering out alerts with active maintenance windows`);

  return opts.input.filter(([{ alert }]) => {
    const alertMaintenanceWindowIds = alert.getMaintenanceWindowIds();

    if (alertMaintenanceWindowIds.length > 0) {
      opts.context.logger.debug(
        `not scheduling of actions for rule "${
          opts.context.ruleId
        }": has active maintenance windows ${alertMaintenanceWindowIds.join(', ')}.`
      );
      return false;
    }

    return true;
  });
};
