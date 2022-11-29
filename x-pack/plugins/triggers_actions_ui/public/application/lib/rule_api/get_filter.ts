/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

const messageFields = [
  'alerting.doc.message',
  'alerting.doc.error.message',
  'actions.doc.message',
  'actions.doc.error.message',
];

// TODO (Jiawei): Use node builder instead of strings
export const getFilter = ({
  message,
  outcomeFilter,
  runId,
}: {
  message?: string;
  outcomeFilter?: string[];
  runId?: string;
}) => {
  const filter: string[] = [];

  if (message) {
    const escapedMessage = message.replace(/([\)\(\<\>\}\{\"\:\\])/gm, '\\$&');
    filter.push(
      `(${messageFields.map((field: string) => `${field}: "${escapedMessage}"`).join(' OR ')})`
    );
  }

  if (outcomeFilter && outcomeFilter.length) {
    const outcomeFilterKQL = getOutcomeFilter(outcomeFilter);
    if (outcomeFilterKQL) {
      filter.push(`(${outcomeFilterKQL})`);
    }
  }

  if (runId) {
    filter.push(`kibana.alert.rule.execution.uuid: ${runId}`);
  }

  return filter;
};

function getOutcomeFilter(outcomeFilter: string[]) {
  const filterMapping: Record<string, string> = {
    failure: 'event.outcome: failure',
    warning: 'kibana.alerting.outcome: warning',
    success:
      'kibana.alerting.outcome:success OR (event.outcome: success AND NOT kibana.alerting.outcome:*)',
    unknown: 'event.outcome: unknown',
  };
  return `${outcomeFilter.map((f) => filterMapping[f]).join(' OR ')}`;
}
