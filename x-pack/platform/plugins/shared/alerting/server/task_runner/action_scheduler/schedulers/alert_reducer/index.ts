/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { Logger } from '@kbn/core/server';
import type { AlertsResult, CategorizedAlert } from '../../../../alerts_client/mappers/types';
import type {
  AlertInstanceState as State,
  AlertInstanceContext as Context,
} from '../../../../types';
import { reducers } from './reducers';
import type { RuleActionWithSummary } from '../../types';

export interface ReducerContext<
  S extends State,
  C extends Context,
  G extends string,
  R extends string
> {
  logger: Logger;
  mutedAlertIds: Set<string>;
  ruleId: string;
}

export interface ReducerOpts<
  S extends State,
  C extends Context,
  G extends string,
  R extends string
> {
  input: Array<AlertActionTuple<S, C, G>>;
  context: ReducerContext<S, C, G, R>;
}

export type AlertReducerFn = <
  S extends State,
  C extends Context,
  G extends string,
  R extends string
>(
  opts: ReducerOpts<S, C, G, R>
) => Promise<Array<AlertActionTuple<S, C, G>>>;

function asyncPipe<S extends State, C extends Context, G extends string, R extends string>(
  ...fns: AlertReducerFn[]
) {
  return async (input: Array<AlertActionTuple<S, C, G>>, context: ReducerContext<S, C, G, R>) => {
    let acc = input;
    for (const reducer of fns) {
      acc = await reducer({ input: acc, context });
    }
    return acc;
  };
}

export type AlertActionTuple<S extends State, C extends Context, G extends string> = [
  CategorizedAlert<S, C, G>,
  RuleActionWithSummary
];

export async function mapAlerts<
  S extends State,
  C extends Context,
  G extends string,
  R extends string
>(
  alerts: AlertsResult<S, C, G>,
  action: RuleActionWithSummary,
  reducerContext: ReducerContext<S, C, G, R>
): Promise<Array<AlertActionTuple<S, C, G>>> {
  const alertActionTuple: Array<AlertActionTuple<S, C, G>> = alerts.map((alert) => [alert, action]);
  return await asyncPipe<S, C, G, R>(...Object.values(reducers))(alertActionTuple, reducerContext);
}
