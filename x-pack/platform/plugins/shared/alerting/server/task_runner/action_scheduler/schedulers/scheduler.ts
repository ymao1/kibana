/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type {
  AlertInstanceState as State,
  AlertInstanceContext as Context,
} from '@kbn/alerting-state-types';
import type { RuleTypeParams } from '@kbn/alerting-types';
import type { RuleTypeState, RuleAlertData as AlertData } from '../../../../common';
import type { ActionReducerFn, ActionSchedulerOptions, ActionsToSchedule } from '../types';
import { asyncPipe } from './action_reducer';

export abstract class Scheduler<
  P extends RuleTypeParams,
  E extends RuleTypeParams,
  T extends RuleTypeState,
  S extends State,
  C extends Context,
  G extends string,
  R extends string,
  A extends AlertData
> {
  constructor(protected readonly context: ActionSchedulerOptions<P, E, T, S, C, G, R, A>) {}

  public abstract get priority(): number;
  public abstract getActionsToSchedule(): Promise<ActionsToSchedule[]>;

  protected async reduceActions<Action>(
    actions: Action[],
    reducers: Readonly<Array<ActionReducerFn<Action>>>
  ): Promise<Action[]> {
    return await asyncPipe<Action, A, S, C, G, R>(...Object.values(reducers))(
      actions,
      this.getReducerContext()
    );
  }

  protected getReducerContext() {
    const canGetSummarizedAlerts =
      !!this.context.ruleType.alerts && !!this.context.alertsClient.getSummarizedAlerts;
    return {
      alertsClient: this.context.alertsClient,
      canGetSummarizedAlerts,
      executionUuid: this.context.executionId,
      logger: this.context.logger,
      mutedAlertIds: this.context.rule.mutedInstanceIds,
      numAlerts: this.context.alerts.length,
      ruleId: this.context.rule.id,
      ruleType: this.context.ruleType.id,
      spaceId: this.context.taskInstance.params.spaceId,
      throttledSummaryActions: this.context.throttledSummaryActions,
    };
  }
}
