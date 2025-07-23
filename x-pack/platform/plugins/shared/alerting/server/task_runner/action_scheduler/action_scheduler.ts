/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { createTaskRunError, TaskErrorSource } from '@kbn/task-manager-plugin/server';
import type { ExecutionResponseItem } from '@kbn/actions-plugin/server/create_execute_function';
import { ExecutionResponseType } from '@kbn/actions-plugin/server/create_execute_function';
import { ActionsCompletion } from '@kbn/alerting-state-types';
import { chunk } from 'lodash';
import type { ThrottledActions } from '../../types';
import type { ActionSchedulerOptions, ActionsToSchedule } from './types';
import type {
  AlertInstanceContext as Context,
  AlertInstanceState as State,
  RuleTypeParams,
  RuleTypeState,
  RuleAlertData as AlertData,
} from '../../../common';
import { getSummaryActionsFromTaskState } from './lib';
import { withAlertingSpan } from '../lib';
import * as schedulers from './schedulers';
import type { AlertsResult } from '../../alerts_client/mappers/types';
import { reduceAlerts } from './reducers';
import type { Scheduler } from './schedulers/scheduler';

const BULK_SCHEDULE_CHUNK_SIZE = 1000;

export interface RunResult {
  throttledSummaryActions: ThrottledActions;
}

export class ActionScheduler<
  P extends RuleTypeParams,
  E extends RuleTypeParams,
  T extends RuleTypeState,
  S extends State,
  C extends Context,
  G extends string,
  R extends string,
  A extends AlertData
> {
  private readonly schedulers: Array<Scheduler<P, E, T, S, C, G, R, A>> = [];

  constructor(private readonly context: ActionSchedulerOptions<P, E, T, S, C, G, R, A>) {
    const throttledSummaryActions = getSummaryActionsFromTaskState({
      actions: this.context.rule.actions,
      summaryActions: this.context.taskInstance.state?.summaryActions,
    });

    for (const [_, scheduler] of Object.entries(schedulers)) {
      this.schedulers.push(new scheduler({ ...context, throttledSummaryActions }));
    }

    // sort schedulers by priority
    this.schedulers.sort((a, b) => a.priority - b.priority);
  }

  public async run(): Promise<RunResult> {
    // reduce alert using reducers that are action independent
    // is rule snoozed
    // is alert in active maintenance window
    // is alert muted
    // const reducedAlerts = await reduceAlerts(alerts, reducerContext);

    const allActionsToScheduleResult: ActionsToSchedule[] = [];
    for (const scheduler of this.schedulers) {
      allActionsToScheduleResult.push(
        ...(await scheduler.getActionsToSchedule({
          activeAlerts,
          recoveredAlerts,
          throttledSummaryActions,
        }))
      );
    }

    if (allActionsToScheduleResult.length === 0) {
      return { throttledSummaryActions };
    }

    let bulkScheduleResponse: ExecutionResponseItem[] = [];

    for (const c of chunk(allActionsToScheduleResult, BULK_SCHEDULE_CHUNK_SIZE)) {
      let enqueueResponse;
      try {
        enqueueResponse = await withAlertingSpan('alerting:bulk-enqueue-actions', () =>
          this.context.actionsClient!.bulkEnqueueExecution(
            c.map((actions) => actions.actionToEnqueue)
          )
        );
      } catch (e) {
        if (e.statusCode === 404) {
          throw createTaskRunError(e, TaskErrorSource.USER);
        }
        throw createTaskRunError(e, TaskErrorSource.FRAMEWORK);
      }
      if (enqueueResponse.errors) {
        bulkScheduleResponse = bulkScheduleResponse.concat(
          enqueueResponse.items.filter(
            (i) => i.response === ExecutionResponseType.QUEUED_ACTIONS_LIMIT_ERROR
          )
        );
      }
    }

    const actionsToNotLog: string[] = [];
    if (bulkScheduleResponse.length) {
      for (const r of bulkScheduleResponse) {
        if (r.response === ExecutionResponseType.QUEUED_ACTIONS_LIMIT_ERROR) {
          this.context.ruleRunMetricsStore.setHasReachedQueuedActionsLimit(true);
          this.context.ruleRunMetricsStore.decrementNumberOfTriggeredActions();
          this.context.ruleRunMetricsStore.decrementNumberOfTriggeredActionsByConnectorType(
            r.actionTypeId
          );
          this.context.ruleRunMetricsStore.setTriggeredActionsStatusByConnectorType({
            actionTypeId: r.actionTypeId,
            status: ActionsCompletion.PARTIAL,
          });

          this.context.logger.debug(
            `Rule "${this.context.rule.id}" skipped scheduling action "${r.id}" because the maximum number of queued actions has been reached.`
          );

          const uuid = r.uuid;
          // uuid is typed as optional but in reality it is always
          // populated - https://github.com/elastic/kibana/issues/195255
          if (uuid) {
            actionsToNotLog.push(uuid);
          }
        }
      }
    }

    const actionsToLog = allActionsToScheduleResult.filter(
      (result) => result.actionToLog.uuid && !actionsToNotLog.includes(result.actionToLog.uuid)
    );

    if (actionsToLog.length) {
      for (const action of actionsToLog) {
        this.context.alertingEventLogger.logAction(action.actionToLog);
      }
    }

    return { throttledSummaryActions };
  }
}
