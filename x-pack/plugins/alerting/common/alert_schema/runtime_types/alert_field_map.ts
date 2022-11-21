/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import * as t from 'io-ts';
import { either } from 'fp-ts/lib/Either';

const NumberFromString = new t.Type(
  'NumberFromString',
  (u): u is number => typeof u === 'number',
  (u, c) =>
    either.chain(t.string.validate(u, c), (s) => {
      const d = Number(s);
      return isNaN(d) ? t.failure(u, c) : t.success(d);
    }),
  (a) => a
);

const BooleanFromString = new t.Type(
  'BooleanFromString',
  (u): u is boolean => typeof u === 'boolean',
  (u, c) =>
    either.chain(t.string.validate(u, c), (s) => {
      switch (s.toLowerCase().trim()) {
        case '1':
        case 'true':
        case 'yes':
          return t.success(true);
        case '0':
        case 'false':
        case 'no':
        case null:
          return t.success(false);
        default:
          return t.failure(u, c);
      }
    }),
  (a) => a
);

const esFieldTypeMap = {
  keyword: t.string,
  version: t.string,
  text: t.string,
  date: t.string,
  boolean: t.union([t.number, BooleanFromString]),
  byte: t.union([t.number, NumberFromString]),
  long: t.union([t.number, NumberFromString]),
  integer: t.union([t.number, NumberFromString]),
  short: t.union([t.number, NumberFromString]),
  double: t.union([t.number, NumberFromString]),
  float: t.union([t.number, NumberFromString]),
  scaled_float: t.union([t.number, NumberFromString]),
  unsigned_long: t.union([t.number, NumberFromString]),
  flattened: t.UnknownRecord,
  object: t.UnknownRecord,
};
const ecsDate = (array: boolean = false) => {};
function ecsStringMulti() {
  return schema.maybe(schema.arrayOf(schema.string()));
}

function ecsString() {
  return schema.maybe(schema.string());
}

function ecsNumber() {
  return schema.maybe(schema.number());
}

function ecsStringOrNumber() {
  return schema.maybe(schema.oneOf([schema.string(), schema.number()]));
}

function ecsDate() {
  return schema.maybe(schema.string({ validate: validateDate }));
}

function ecsBoolean() {
  return schema.maybe(schema.boolean());
}

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

function validateDate(isoDate: string) {
  if (ISO_DATE_PATTERN.test(isoDate)) return;
  return 'string is not a valid ISO date: ' + isoDate;
}

function ecsVersion() {
  return schema.maybe(schema.string({ validate: validateVersion }));
}

function validateVersion(version: string) {
  if (semver.valid(version)) return;
  return 'string is not a valid version: ' + version;
}
// import {
//   ALERT_ACTION_GROUP,
//   ALERT_ANCESTORS,
//   ALERT_ANCESTORS_DEPTH,
//   ALERT_ANCESTORS_ID,
//   ALERT_ANCESTORS_INDEX,
//   ALERT_ANCESTORS_RULE,
//   ALERT_ANCESTORS_TYPE,
//   ALERT_DEPTH,
//   ALERT_DURATION,
//   ALERT_END,
//   ALERT_EVALUATION_RESULTS,
//   ALERT_EVALUATION_RESULTS_THRESHOLDS_COMPARATOR,
//   ALERT_EVALUATION_RESULTS_THRESHOLDS_TYPE,
//   ALERT_EVALUATION_RESULTS_THRESHOLDS_VALUE,
//   ALERT_EVALUATION_RESULTS_VALUE,
//   ALERT_FLAPPING,
//   ALERT_GROUP_ID,
//   ALERT_GROUP_INDEX,
//   ALERT_ID,
//   ALERT_NEW_TERMS,
//   ALERT_ORIGINAL_EVENT_ACTION,
//   ALERT_ORIGINAL_EVENT_AGENT_ID_STATUS,
//   ALERT_ORIGINAL_EVENT_CATEGORY,
//   ALERT_ORIGINAL_EVENT_CODE,
//   ALERT_ORIGINAL_EVENT_CREATED,
//   ALERT_ORIGINAL_EVENT_DATASET,
//   ALERT_ORIGINAL_EVENT_DURATION,
//   ALERT_ORIGINAL_EVENT_END,
//   ALERT_ORIGINAL_EVENT_HASH,
//   ALERT_ORIGINAL_EVENT_ID,
//   ALERT_ORIGINAL_EVENT_INGESTED,
//   ALERT_ORIGINAL_EVENT_KIND,
//   ALERT_ORIGINAL_EVENT_MODULE,
//   ALERT_ORIGINAL_EVENT_ORIGINAL,
//   ALERT_ORIGINAL_EVENT_OUTCOME,
//   ALERT_ORIGINAL_EVENT_PROVIDER,
//   ALERT_ORIGINAL_EVENT_REASON,
//   ALERT_ORIGINAL_EVENT_REFERENCE,
//   ALERT_ORIGINAL_EVENT_RISK_SCORE,
//   ALERT_ORIGINAL_EVENT_RISK_SCORE_NORM,
//   ALERT_ORIGINAL_EVENT_SEQUENCE,
//   ALERT_ORIGINAL_EVENT_SEVERITY,
//   ALERT_ORIGINAL_EVENT_START,
//   ALERT_ORIGINAL_EVENT_TIMEZONE,
//   ALERT_ORIGINAL_EVENT_TYPE,
//   ALERT_ORIGINAL_EVENT_URL,
//   ALERT_ORIGINAL_TIME,
//   ALERT_REASON,
//   ALERT_RISK_SCORE,
//   ALERT_RULE_CATEGORY,
//   ALERT_RULE_CONSUMER,
//   ALERT_RULE_EXECUTION_UUID,
//   ALERT_RULE_NAME,
//   ALERT_RULE_PARAMETERS,
//   ALERT_RULE_PRODUCER,
//   ALERT_RULE_TAGS,
//   ALERT_RULE_TYPE_ID,
//   ALERT_RULE_UUID,
//   ALERT_SEVERITY,
//   ALERT_START,
//   ALERT_STATUS,
//   ALERT_THRESHOLD_RESULT_CARDINALITY,
//   ALERT_THRESHOLD_RESULT_CARDINALITY_FIELD,
//   ALERT_THRESHOLD_RESULT_CARDINALITY_VALUE,
//   ALERT_THRESHOLD_RESULT_COUNT,
//   ALERT_THRESHOLD_RESULT_FROM,
//   ALERT_THRESHOLD_RESULT_TERMS,
//   ALERT_THRESHOLD_RESULT_TERMS_FIELD,
//   ALERT_THRESHOLD_RESULT_TERMS_VALUE,
//   ALERT_TIME_RANGE,
//   ALERT_UUID,
//   ALERT_WORKFLOW_STATUS,
//   ANOMALY_BUCKET_SPAN_MINUTES,
//   ANOMALY_START,
//   MONITOR_ID,
//   MONITOR_NAME,
//   MONITOR_TYPE,
//   PROCESSOR_EVENT,
//   SPACE_IDS,
//   TRANSACTION_TYPE,
//   TRANSACTION_NAME,
//   VERSION,
// } from '@kbn/rule-data-utils';

// export const alertFieldMap = {
//   [ALERT_RULE_PARAMETERS]: {
//     type: 'object',
//     enabled: false,
//     required: false,
//   },
//   [ALERT_RULE_TYPE_ID]: {
//     type: 'keyword',
//     array: false,
//     required: true,
//   },
//   [ALERT_RULE_CONSUMER]: {
//     type: 'keyword',
//     array: false,
//     required: true,
//   },
//   [ALERT_RULE_PRODUCER]: {
//     type: 'keyword',
//     array: false,
//     required: true,
//   },
//   [SPACE_IDS]: {
//     type: 'keyword',
//     array: true,
//     required: true,
//   },
//   [ALERT_UUID]: {
//     type: 'keyword',
//     array: false,
//     required: true,
//   },
//   [ALERT_ID]: {
//     type: 'keyword',
//     array: false,
//     required: true,
//   },
//   [ALERT_START]: {
//     type: 'date',
//     array: false,
//     required: false,
//   },
//   [ALERT_TIME_RANGE]: {
//     type: 'date_range',
//     format: 'epoch_millis||strict_date_optional_time',
//     array: false,
//     required: false,
//   },
//   [ALERT_END]: {
//     type: 'date',
//     array: false,
//     required: false,
//   },
//   [ALERT_DURATION]: {
//     type: 'long',
//     array: false,
//     required: false,
//   },
//   [ALERT_SEVERITY]: {
//     type: 'keyword',
//     array: false,
//     required: false,
//   },
//   [ALERT_STATUS]: {
//     type: 'keyword',
//     array: false,
//     required: true,
//   },
//   [VERSION]: {
//     type: 'version',
//     array: false,
//     required: false,
//   },
//   [ALERT_RISK_SCORE]: {
//     type: 'float',
//     array: false,
//     required: false,
//   },
//   [ALERT_WORKFLOW_STATUS]: {
//     type: 'keyword',
//     array: false,
//     required: false,
//   },
//   [ALERT_ACTION_GROUP]: {
//     type: 'keyword',
//     array: false,
//     required: false,
//   },
//   [ALERT_REASON]: {
//     type: 'keyword',
//     array: false,
//     required: false,
//   },
//   [ALERT_RULE_CATEGORY]: {
//     type: 'keyword',
//     array: false,
//     required: true,
//   },
//   [ALERT_RULE_UUID]: {
//     type: 'keyword',
//     array: false,
//     required: true,
//   },
//   [ALERT_RULE_EXECUTION_UUID]: {
//     type: 'keyword',
//     array: false,
//     required: false,
//   },
//   [ALERT_RULE_NAME]: {
//     type: 'keyword',
//     array: false,
//     required: true,
//   },
//   [ALERT_RULE_TAGS]: {
//     type: 'keyword',
//     array: true,
//     required: false,
//   },
//   [ALERT_EVALUATION_RESULTS]: {
//     type: 'object',
//     array: true,
//     required: false,
//   },
//   [ALERT_EVALUATION_RESULTS_THRESHOLDS_COMPARATOR]: {
//     type: 'keyword',
//     array: false,
//     required: false,
//   },
//   [ALERT_EVALUATION_RESULTS_THRESHOLDS_TYPE]: {
//     type: 'keyword',
//     array: false,
//     required: false,
//   },
//   [ALERT_EVALUATION_RESULTS_THRESHOLDS_VALUE]: {
//     type: 'keyword',
//     array: true,
//     required: false,
//   },
//   [ALERT_EVALUATION_RESULTS_VALUE]: {
//     type: 'float',
//     array: false,
//     required: false,
//   },
//   [ALERT_FLAPPING]: {
//     type: 'boolean',
//     array: false,
//     required: false,
//   },
//   [TRANSACTION_TYPE]: {
//     type: 'keyword',
//     array: false,
//     required: false,
//   },
//   [TRANSACTION_NAME]: {
//     type: 'keyword',
//     array: false,
//     required: false,
//   },
//   [PROCESSOR_EVENT]: {
//     type: 'keyword',
//     array: false,
//     required: false,
//   },
//   [MONITOR_ID]: {
//     type: 'keyword',
//     array: false,
//     required: false,
//   },
//   [MONITOR_NAME]: {
//     type: 'keyword',
//     array: false,
//     required: false,
//   },
//   [MONITOR_TYPE]: {
//     type: 'keyword',
//     array: false,
//     required: false,
//   },
//   [ANOMALY_START]: {
//     type: 'keyword',
//     array: false,
//     required: false,
//   },
//   [ANOMALY_BUCKET_SPAN_MINUTES]: {
//     type: 'keyword',
//     array: false,
//     required: false,
//   },
//   [ALERT_ANCESTORS]: {
//     type: 'object',
//     array: true,
//     required: false,
//   },
//   [ALERT_ANCESTORS_DEPTH]: {
//     type: 'long',
//     array: false,
//     required: false,
//   },
//   [ALERT_ANCESTORS_ID]: {
//     type: 'keyword',
//     array: false,
//     required: false,
//   },
//   [ALERT_ANCESTORS_INDEX]: {
//     type: 'keyword',
//     array: false,
//     required: false,
//   },
//   [ALERT_ANCESTORS_RULE]: {
//     type: 'keyword',
//     array: false,
//     required: false,
//   },
//   [ALERT_ANCESTORS_TYPE]: {
//     type: 'keyword',
//     array: false,
//     required: false,
//   },
//   [ALERT_DEPTH]: {
//     type: 'long',
//     array: false,
//     required: false,
//   },
//   [ALERT_GROUP_ID]: {
//     type: 'keyword',
//     array: false,
//     required: false,
//   },
//   [ALERT_GROUP_INDEX]: {
//     type: 'integer',
//     array: false,
//     required: false,
//   },
//   [ALERT_ORIGINAL_EVENT_ACTION]: {
//     type: 'keyword',
//     array: false,
//     required: false,
//   },
//   [ALERT_ORIGINAL_EVENT_AGENT_ID_STATUS]: {
//     type: 'keyword',
//     array: false,
//     required: false,
//   },
//   [ALERT_ORIGINAL_EVENT_CATEGORY]: {
//     type: 'keyword',
//     array: true,
//     required: false,
//   },
//   [ALERT_ORIGINAL_EVENT_CODE]: {
//     type: 'keyword',
//     array: false,
//     required: false,
//   },
//   [ALERT_ORIGINAL_EVENT_CREATED]: {
//     type: 'date',
//     array: false,
//     required: false,
//   },
//   [ALERT_ORIGINAL_EVENT_DATASET]: {
//     type: 'keyword',
//     array: false,
//     required: false,
//   },
//   [ALERT_ORIGINAL_EVENT_DURATION]: {
//     type: 'keyword',
//     array: false,
//     required: false,
//   },
//   [ALERT_ORIGINAL_EVENT_END]: {
//     type: 'date',
//     array: false,
//     required: false,
//   },
//   [ALERT_ORIGINAL_EVENT_HASH]: {
//     type: 'keyword',
//     array: false,
//     required: false,
//   },
//   [ALERT_ORIGINAL_EVENT_ID]: {
//     type: 'keyword',
//     array: false,
//     required: false,
//   },
//   [ALERT_ORIGINAL_EVENT_INGESTED]: {
//     type: 'date',
//     array: false,
//     required: false,
//   },
//   [ALERT_ORIGINAL_EVENT_KIND]: {
//     type: 'keyword',
//     array: false,
//     required: false,
//   },
//   [ALERT_ORIGINAL_EVENT_MODULE]: {
//     type: 'keyword',
//     array: false,
//     required: false,
//   },
//   [ALERT_ORIGINAL_EVENT_ORIGINAL]: {
//     type: 'keyword',
//     array: false,
//     required: false,
//   },
//   [ALERT_ORIGINAL_EVENT_OUTCOME]: {
//     type: 'keyword',
//     array: false,
//     required: false,
//   },
//   [ALERT_ORIGINAL_EVENT_PROVIDER]: {
//     type: 'keyword',
//     array: false,
//     required: false,
//   },
//   [ALERT_ORIGINAL_EVENT_REASON]: {
//     type: 'keyword',
//     array: false,
//     required: false,
//   },
//   [ALERT_ORIGINAL_EVENT_REFERENCE]: {
//     type: 'keyword',
//     array: false,
//     required: false,
//   },
//   [ALERT_ORIGINAL_EVENT_RISK_SCORE]: {
//     type: 'float',
//     array: false,
//     required: false,
//   },
//   [ALERT_ORIGINAL_EVENT_RISK_SCORE_NORM]: {
//     type: 'float',
//     array: false,
//     required: false,
//   },
//   [ALERT_ORIGINAL_EVENT_SEQUENCE]: {
//     type: 'long',
//     array: false,
//     required: false,
//   },
//   [ALERT_ORIGINAL_EVENT_SEVERITY]: {
//     type: 'long',
//     array: false,
//     required: false,
//   },
//   [ALERT_ORIGINAL_EVENT_START]: {
//     type: 'date',
//     array: false,
//     required: false,
//   },
//   [ALERT_ORIGINAL_EVENT_TIMEZONE]: {
//     type: 'keyword',
//     array: false,
//     required: false,
//   },
//   [ALERT_ORIGINAL_EVENT_TYPE]: {
//     type: 'keyword',
//     array: true,
//     required: false,
//   },
//   [ALERT_ORIGINAL_EVENT_URL]: {
//     type: 'keyword',
//     array: false,
//     required: false,
//   },
//   [ALERT_ORIGINAL_TIME]: {
//     type: 'date',
//     array: false,
//     required: false,
//   },
//   [ALERT_THRESHOLD_RESULT_CARDINALITY]: {
//     type: 'object',
//     array: false,
//     required: false,
//   },
//   [ALERT_THRESHOLD_RESULT_CARDINALITY_FIELD]: {
//     type: 'keyword',
//     array: false,
//     required: false,
//   },
//   [ALERT_THRESHOLD_RESULT_CARDINALITY_VALUE]: {
//     type: 'long',
//     array: false,
//     required: false,
//   },
//   [ALERT_THRESHOLD_RESULT_COUNT]: {
//     type: 'long',
//     array: false,
//     required: false,
//   },
//   [ALERT_THRESHOLD_RESULT_FROM]: {
//     type: 'date',
//     array: false,
//     required: false,
//   },
//   [ALERT_THRESHOLD_RESULT_TERMS]: {
//     type: 'object',
//     array: true,
//     required: false,
//   },
//   [ALERT_THRESHOLD_RESULT_TERMS_FIELD]: {
//     type: 'keyword',
//     array: false,
//     required: false,
//   },
//   [ALERT_THRESHOLD_RESULT_TERMS_VALUE]: {
//     type: 'keyword',
//     array: false,
//     required: false,
//   },
//   [ALERT_NEW_TERMS]: {
//     type: 'keyword',
//     array: true,
//     required: false,
//   },
// };

// export type AlertFieldMap = typeof alertFieldMap;
