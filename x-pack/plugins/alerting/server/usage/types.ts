/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { EventSchema } from './generated/event_log_telemetry_types';

export interface AlertingLegacyUsage {
  has_errors: boolean;
  error_messages?: string[];
  count_total: number;
  count_active_total: number;
  count_disabled_total: number;
  count_by_type: Record<string, number>;
  count_active_by_type: Record<string, number>;
  count_rules_namespaces: number;
  count_rules_executions_per_day: number;
  count_rules_executions_by_type_per_day: Record<string, number>;
  count_rules_executions_failured_per_day: number;
  count_rules_executions_failured_by_reason_per_day: Record<string, number>;
  count_rules_executions_failured_by_reason_by_type_per_day: Record<string, Record<string, number>>;
  count_rules_executions_timeouts_per_day: number;
  count_rules_executions_timeouts_by_type_per_day: Record<string, number>;
  count_failed_and_unrecognized_rule_tasks_per_day: number;
  count_failed_and_unrecognized_rule_tasks_by_status_per_day: Record<string, number>;
  count_failed_and_unrecognized_rule_tasks_by_status_by_type_per_day: Record<
    string,
    Record<string, number>
  >;
  count_rules_by_execution_status: {
    success: number;
    error: number;
    warning: number;
  };
  count_rules_with_tags: number;
  count_rules_by_notify_when: {
    on_action_group_change: number;
    on_active_alert: number;
    on_throttle_interval: number;
  };
  count_connector_types_by_consumers: Record<string, Record<string, number>>;
  count_rules_snoozed: number;
  count_rules_muted: number;
  count_rules_with_muted_alerts: number;
  count_rules_by_execution_status_per_day: Record<string, number>;
  throttle_time: {
    min: string;
    avg: string;
    max: string;
  };
  schedule_time: {
    min: string;
    avg: string;
    max: string;
  };
  throttle_time_number_s: {
    min: number;
    avg: number;
    max: number;
  };
  schedule_time_number_s: {
    min: number;
    avg: number;
    max: number;
  };
  connectors_per_alert: {
    min: number;
    avg: number;
    max: number;
  };
}

export type AlertingUsage = AlertingLegacyUsage & EventSchema;
