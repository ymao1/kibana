/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import { HttpSetup } from 'kibana/public';
import { INTERNAL_BASE_ALERTING_API_PATH } from '../../constants';
import { AlertInstanceSummary } from '../../../types';
import { RewriteRequestCase } from '../../../../../actions/common';

const rewriteBodyRes: RewriteRequestCase<AlertInstanceSummary> = ({
  alerts,
  rule_type_id: alertTypeId,
  mute_all: muteAll,
  status_start_date: statusStartDate,
  status_end_date: statusEndDate,
  error_messages: errorMessages,
  last_run: lastRun,
  ...rest
}: any) => ({
  ...rest,
  alertTypeId,
  muteAll,
  statusStartDate,
  statusEndDate,
  errorMessages,
  lastRun,
  instances: alerts,
});

export async function loadRuleMonitoringSummary({
  http,
  ruleId,
}: {
  http: HttpSetup;
  ruleId: string;
}): Promise<any> {
  const res = await http.get(
    `${INTERNAL_BASE_ALERTING_API_PATH}/rule/${encodeURIComponent(ruleId)}/_monitoring_summary`
  );
  return rewriteBodyRes(res);
}

export async function loadRuleMonitoringOverview({ http }: { http: HttpSetup }): Promise<any> {
  return await http.get(`${INTERNAL_BASE_ALERTING_API_PATH}/rule/_monitoring_overview`);
}
