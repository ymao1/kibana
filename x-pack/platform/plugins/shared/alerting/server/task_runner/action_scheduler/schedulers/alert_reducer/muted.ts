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

export const filterMuted: AlertReducerFn = async <
  S extends State,
  C extends Context,
  G extends string,
  R extends string
>(
  opts: ReducerOpts<S, C, G, R>
) => {
  opts.context.logger.info(`Filtering out muted alerts`);

  return opts.alerts.filter(({ alert }) => {
    const alertId = alert.getId();
    const muted = opts.context.mutedAlertIds.has(alertId);

    if (muted) {
      opts.context.logger.debug(
        `not scheduling of actions for alert "${alertId}" in rule "${opts.context.ruleId}": alert is muted.`
      );
      return false;
    }

    return true;
  });
};
