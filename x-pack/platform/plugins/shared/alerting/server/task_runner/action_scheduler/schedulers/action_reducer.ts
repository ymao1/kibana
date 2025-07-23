/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type {
  RuleAlertData as AlertData,
  AlertInstanceState as State,
  AlertInstanceContext as Context,
} from '../../../../types';

import type { ActionReducerFn, ActionReducerContext } from '../../types';

export function asyncPipe<
  Action,
  A extends AlertData,
  S extends State,
  C extends Context,
  G extends string,
  R extends string
>(...fns: Array<ActionReducerFn<Action>>) {
  return async (input: Action[], context: ActionReducerContext<A, S, C, G, R>) => {
    let acc = input;
    for (const reducer of fns) {
      acc = await reducer({ actions: acc, context });
    }
    return acc;
  };
}
