/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { Logger } from '@kbn/core/server';
import type { PublicMethodsOf } from '@kbn/utility-types';
import type { ActionsClient } from '@kbn/actions-plugin/server/actions_client';
import type { ExecuteOptions as EnqueueExecutionOptions } from '@kbn/actions-plugin/server/create_execute_function';
import type { TaskPriority } from '@kbn/task-manager-plugin/server';
import type { IAlertsClient } from '../../alerts_client/types';
import type { Alert } from '../../alert';
import type {
  AlertInstanceContext as Context,
  AlertInstanceState as State,
  RuleTypeParams,
  SanitizedRule,
  RuleTypeState,
  RuleAction,
  RuleAlertData as AlertData,
  RuleSystemAction,
  ThrottledActions,
} from '../../../common';
import type { NormalizedRuleType } from '../../rule_type_registry';
import type { CombinedSummarizedAlerts, RawRule } from '../../types';
import type { RuleRunMetricsStore } from '../../lib/rule_run_metrics_store';
import type {
  ActionOpts,
  AlertingEventLogger,
} from '../../lib/alerting_event_logger/alerting_event_logger';
import type { RuleTaskInstance, TaskRunnerContext } from '../types';
import type { AlertsResult } from '../../alerts_client/mappers/types';

export type ActionSchedulerRule<Params extends RuleTypeParams> = Omit<
  SanitizedRule<Params>,
  'executionStatus'
>;
export interface ActionSchedulerOptions<
  P extends RuleTypeParams,
  E extends RuleTypeParams,
  T extends RuleTypeState,
  S extends State,
  C extends Context,
  G extends string,
  R extends string,
  A extends AlertData
> {
  actionsClient: PublicMethodsOf<ActionsClient>;
  alertingEventLogger: PublicMethodsOf<AlertingEventLogger>;
  alerts: AlertsResult<S, C, G>;
  alertsClient: IAlertsClient<A, S, C, G, R>;
  apiKey: RawRule['apiKey'];
  executionId: string;
  logger: Logger;
  previousStartedAt: Date | null;
  priority?: TaskPriority;
  rule: ActionSchedulerRule<P>;
  ruleConsumer: string;
  ruleLabel: string;
  ruleRunMetricsStore: RuleRunMetricsStore;
  ruleType: NormalizedRuleType<P, E, T, S, C, G, R, A>;
  taskInstance: RuleTaskInstance;
  taskRunnerContext: TaskRunnerContext;
  throttledSummaryActions?: ThrottledActions;
}

export type Executable<S extends State, C extends Context, G extends string, R extends string> = {
  action: RuleAction | RuleSystemAction;
} & (
  | {
      alert: Alert<S, C, G | R>;
      summarizedAlerts?: never;
    }
  | {
      alert?: never;
      summarizedAlerts: CombinedSummarizedAlerts;
    }
);

export interface ActionsToSchedule {
  actionToEnqueue: EnqueueExecutionOptions;
  actionToLog: ActionOpts;
}
export interface RuleUrl {
  absoluteUrl?: string;
  kibanaBaseUrl?: string;
  basePathname?: string;
  spaceIdSegment?: string;
  relativePath?: string;
}

export interface IsExecutableAlertOpts<G extends string, R extends string> {
  alert: Alert<State, Context, G | R>;
  action: RuleAction;
  summarizedAlerts: CombinedSummarizedAlerts | null;
}

export interface IsExecutableActiveAlertOpts<ActionGroupIds extends string> {
  alert: Alert<State, Context, ActionGroupIds>;
  action: RuleAction;
}

export interface HelperOpts<ActionGroupIds extends string, RecoveryActionGroupId extends string> {
  alert: Alert<State, Context, ActionGroupIds | RecoveryActionGroupId>;
  action: RuleAction;
}

export interface AddSummarizedAlertsOpts<
  ActionGroupIds extends string,
  RecoveryActionGroupId extends string
> {
  alert: Alert<State, Context, ActionGroupIds | RecoveryActionGroupId>;
  summarizedAlerts: CombinedSummarizedAlerts | null;
}

export type RuleActionWithSummary = RuleAction & {
  summarizedAlerts?: CombinedSummarizedAlerts;
};

export interface ActionReducerContext<
  A extends AlertData,
  S extends State,
  C extends Context,
  G extends string,
  R extends string
> {
  alertsClient: IAlertsClient<A, S, C, G, R>;
  canGetSummarizedAlerts: boolean;
  executionUuid: string;
  logger: Logger;
  mutedAlertIds: string[];
  numAlerts: number;
  ruleId: string;
  ruleType: string;
  spaceId: string;
  throttledSummaryActions?: ThrottledActions;
}
export interface ReducerOpts<
  Action,
  A extends AlertData,
  S extends State,
  C extends Context,
  G extends string,
  R extends string
> {
  actions: Action[];
  context: ActionReducerContext<A, S, C, G, R>;
}

export type ActionReducerFn<Action> = <
  A extends AlertData,
  S extends State,
  C extends Context,
  G extends string,
  R extends string
>(
  opts: ReducerOpts<Action, A, S, C, G, R>
) => Promise<Action[]>;

export interface AlertReducerContext<
  A extends AlertData,
  S extends State,
  C extends Context,
  G extends string,
  R extends string
> {}
