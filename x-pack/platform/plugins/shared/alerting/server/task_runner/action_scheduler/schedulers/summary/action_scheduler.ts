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
import type { RuleAction, RuleTypeParams } from '@kbn/alerting-types';
import type { CombinedSummarizedAlerts } from '../../../../types';
import type { RuleTypeState, RuleAlertData as AlertData } from '../../../../../common';
import { parseDuration } from '../../../../../common';
import type { GetSummarizedAlertsParams } from '../../../../alerts_client/types';
import {
  buildRuleUrl,
  formatActionToEnqueue,
  getSummarizedAlerts,
  getSummaryActionTimeBounds,
  isActionOnInterval,
  isSummaryActionThrottled,
  logNumberOfFilteredAlerts,
  shouldScheduleAction,
} from '../../lib';
import type { ActionSchedulerOptions, ActionsToSchedule, RuleActionWithSummary } from '../../types';
import { injectActionParams } from '../../../inject_action_params';
import { transformSummaryActionParams } from '../../../transform_action_params';
import { Scheduler } from '../scheduler';
import { reducers } from './reducers/action/reducers';

export class SummaryActionScheduler<
  P extends RuleTypeParams,
  E extends RuleTypeParams,
  T extends RuleTypeState,
  S extends State,
  C extends Context,
  G extends string,
  R extends string,
  A extends AlertData
> extends Scheduler<P, E, T, S, C, G, R, A> {
  constructor(protected readonly context: ActionSchedulerOptions<P, E, T, S, C, G, R, A>) {
    super(context);
  }

  public get priority(): number {
    return 0;
  }

  public async getActionsToSchedule(): Promise<ActionsToSchedule[]> {
    const actions = await super.reduceActions<RuleActionWithSummary>(
      this.context.rule.actions,
      reducers
    );

    const executables: Array<{
      action: RuleAction;
      summarizedAlerts: CombinedSummarizedAlerts;
    }> = [];
    const results: ActionsToSchedule[] = [];

    for (const action of actions) {
      const actionHasThrottleInterval = isActionOnInterval(action);
      const optionsBase = {
        spaceId: this.context.taskInstance.params.spaceId,
        ruleId: this.context.rule.id,
        excludedAlertInstanceIds: this.context.rule.mutedInstanceIds,
        alertsFilter: action.alertsFilter,
      };

      let options: GetSummarizedAlertsParams;
      if (actionHasThrottleInterval) {
        const throttleMills = parseDuration(action.frequency!.throttle!);
        const start = new Date(Date.now() - throttleMills);
        options = { ...optionsBase, start, end: new Date() };
      } else {
        options = { ...optionsBase, executionUuid: this.context.executionId };
      }

      const summarizedAlerts = await getSummarizedAlerts({
        queryOptions: options,
        alertsClient: this.context.alertsClient,
      });

      if (!actionHasThrottleInterval) {
        logNumberOfFilteredAlerts({
          logger: this.context.logger,
          numberOfAlerts: Object.entries(alerts).length,
          numberOfSummarizedAlerts: summarizedAlerts.all.count,
          action,
        });
      }

      if (summarizedAlerts.all.count !== 0) {
        executables.push({ action, summarizedAlerts });
      }
    }

    if (executables.length === 0) return [];

    this.context.ruleRunMetricsStore.incrementNumberOfGeneratedActions(executables.length);

    for (const { action, summarizedAlerts } of executables) {
      const { actionTypeId } = action;

      if (
        !shouldScheduleAction({
          action,
          actionsConfigMap: this.context.taskRunnerContext.actionsConfigMap,
          isActionExecutable: this.context.taskRunnerContext.actionsPlugin.isActionExecutable,
          logger: this.context.logger,
          ruleId: this.context.rule.id,
          ruleRunMetricsStore: this.context.ruleRunMetricsStore,
        })
      ) {
        continue;
      }

      this.context.ruleRunMetricsStore.incrementNumberOfTriggeredActions();
      this.context.ruleRunMetricsStore.incrementNumberOfTriggeredActionsByConnectorType(
        actionTypeId
      );

      if (isActionOnInterval(action) && throttledSummaryActions) {
        throttledSummaryActions[action.uuid!] = { date: new Date().toISOString() };
      }

      const { start, end } = getSummaryActionTimeBounds(
        action,
        this.context.rule.schedule,
        this.context.previousStartedAt
      );

      const ruleUrl = buildRuleUrl({
        end,
        getViewInAppRelativeUrl: this.context.ruleType.getViewInAppRelativeUrl,
        kibanaBaseUrl: this.context.taskRunnerContext.kibanaBaseUrl,
        logger: this.context.logger,
        rule: this.context.rule,
        spaceId: this.context.taskInstance.params.spaceId,
        start,
      });

      const actionToRun = {
        ...action,
        params: injectActionParams({
          actionTypeId: action.actionTypeId,
          ruleUrl,
          ruleName: this.context.rule.name,
          actionParams: transformSummaryActionParams({
            alerts: summarizedAlerts,
            rule: this.context.rule,
            ruleTypeId: this.context.ruleType.id,
            actionId: action.id,
            actionParams: action.params,
            spaceId: this.context.taskInstance.params.spaceId,
            actionsPlugin: this.context.taskRunnerContext.actionsPlugin,
            actionTypeId: action.actionTypeId,
            kibanaBaseUrl: this.context.taskRunnerContext.kibanaBaseUrl,
            ruleUrl: ruleUrl?.absoluteUrl,
          }),
        }),
      };

      results.push({
        actionToEnqueue: formatActionToEnqueue({
          action: actionToRun,
          apiKey: this.context.apiKey,
          executionId: this.context.executionId,
          priority: this.context.priority,
          ruleConsumer: this.context.ruleConsumer,
          ruleId: this.context.rule.id,
          ruleTypeId: this.context.ruleType.id,
          spaceId: this.context.taskInstance.params.spaceId,
        }),
        actionToLog: {
          id: action.id,
          uuid: action.uuid,
          typeId: action.actionTypeId,
          alertSummary: {
            new: summarizedAlerts.new.count,
            ongoing: summarizedAlerts.ongoing.count,
            recovered: summarizedAlerts.recovered.count,
          },
        },
      });
    }

    return results;
  }
}
