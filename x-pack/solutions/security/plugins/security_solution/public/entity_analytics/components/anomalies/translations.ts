/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { i18n } from '@kbn/i18n';

export const ENTITY_ANOMALIES_SECTION_TITLE = i18n.translate(
  'xpack.securitySolution.entityAnalytics.entityAnomalies.sectionTitle',
  { defaultMessage: 'Behavioral anomalies' }
);

export const ENTITY_ANOMALIES_OVERVIEW_TIMEFRAME = i18n.translate(
  'xpack.securitySolution.entityAnalytics.entityAnomalies.timeframeLabel',
  { defaultMessage: 'Last 30 days' }
);

export const ENTITY_ANOMALIES_ALL_LINK_TITLE = i18n.translate(
  'xpack.securitySolution.entityAnalytics.entityAnomalies.allAnomaliesLink',
  { defaultMessage: 'All anomalies' }
);

export const ENTITY_ANOMALIES_ALL_LINK_TOOLTIP = i18n.translate(
  'xpack.securitySolution.entityAnalytics.entityAnomalies.allAnomaliesTooltip',
  { defaultMessage: 'Show all behavioral anomalies' }
);

export const getEntityAnomaliesCountLabel = (count: number) =>
  i18n.translate(
    'xpack.securitySolution.entityAnalytics.entityAnomalies.overview.anomaliesCountLabel',
    {
      defaultMessage: '{count, plural, one {Anomaly} other {Anomalies}}',
      values: { count },
    }
  );

export const getEntityAnomaliesTacticsCountLabel = (count: number) =>
  i18n.translate(
    'xpack.securitySolution.entityAnalytics.entityAnomalies.overview.tacticsCountLabel',
    {
      defaultMessage: '{count, plural, one {Tactic} other {Tactics}}',
      values: { count },
    }
  );

export const ENTITY_ANOMALIES_SWIMLANE_MAX_SCORE = i18n.translate(
  'xpack.securitySolution.entityAnalytics.entityAnomalies.overview.swimlane.maxAnomalyScore',
  { defaultMessage: 'Max anomaly score' }
);

export const ENTITY_ANOMALIES_SWIMLANE_X_AXIS_LABEL = i18n.translate(
  'xpack.securitySolution.entityAnalytics.entityAnomalies.overview.swimlane.xAxis',
  { defaultMessage: 'Date' }
);

export const ENTITY_ANOMALIES_TAB_MANAGE_ML_JOBS = i18n.translate(
  'xpack.securitySolution.entityAnalytics.entityAnomalies.tab.manageMlJobs',
  { defaultMessage: 'Manage ML jobs' }
);

export const ENTITY_ANOMALIES_CLEAR_TACTIC_LABEL = i18n.translate(
  'xpack.securitySolution.entityAnalytics.entityAnomalies.tab.clearTactic',
  { defaultMessage: 'Clear tactic filter' }
);

export const ENTITY_ANOMALIES_TAB_ATTACK_CHAIN_TITLE = i18n.translate(
  'xpack.securitySolution.entityAnalytics.entityAnomalies.tab.attackChainTitle',
  { defaultMessage: 'Attack chain' }
);

export const getEntityAnomaliesFilteredByTacticLabel = (tactic: string) =>
  i18n.translate(
    'xpack.securitySolution.entityAnalytics.entityAnomalies.tab.filteredByTacticLabel',
    {
      defaultMessage: 'Filtered by: {tactic}',
      values: { tactic },
    }
  );

export const ENTITY_ANOMALY_TIMELINE_TITLE = i18n.translate(
  'xpack.securitySolution.entityAnalytics.entityAnomalies.tab.anomalyTimelineTitle',
  { defaultMessage: 'Anomaly timeline' }
);

export const ENTITY_ANOMALY_TABLE_TITLE = i18n.translate(
  'xpack.securitySolution.entityAnalytics.entityAnomalies.tab.anomalyTableTitle',
  { defaultMessage: 'Anomalies' }
);

export const ENTITY_ANOMALY_TABLE_CAPTION = i18n.translate(
  'xpack.securitySolution.entityAnalytics.entityAnomalies.tab.anomalyTableCaption',
  { defaultMessage: 'Anomaly records' }
);

export const ENTITY_ANOMALY_TABLE_EXPAND_ROW_TOOLTIP = i18n.translate(
  'xpack.securitySolution.entityAnalytics.entityAnomalies.tab.anomalyTable.expandRowTooltip',
  { defaultMessage: 'Expand row' }
);

export const ENTITY_ANOMALY_TABLE_COLLAPSE_ROW_TOOLTIP = i18n.translate(
  'xpack.securitySolution.entityAnalytics.entityAnomalies.tab.anomalyTable.collapseRowTooltip',
  { defaultMessage: 'Collapse row' }
);

export const ENTITY_ANOMALY_TABLE_JOB_COLUMN = i18n.translate(
  'xpack.securitySolution.entityAnalytics.entityAnomalies.tab.anomalyTable.jobColumn',
  { defaultMessage: 'ML job' }
);

export const ENTITY_ANOMALY_TABLE_TACTIC_COLUMN = i18n.translate(
  'xpack.securitySolution.entityAnalytics.entityAnomalies.tab.anomalyTable.tacticColumn',
  { defaultMessage: 'Tactic' }
);

export const ENTITY_ANOMALY_TABLE_TACTIC_POPOVER_TITLE = i18n.translate(
  'xpack.securitySolution.entityAnalytics.entityAnomalies.tab.anomalyTable.tacticPopoverTitle',
  { defaultMessage: 'Tactics' }
);

export const ENTITY_ANOMALY_TABLE_TIMESTAMP_COLUMN = i18n.translate(
  'xpack.securitySolution.entityAnalytics.entityAnomalies.tab.anomalyTable.timestampColumn',
  { defaultMessage: 'Timestamp' }
);

export const ENTITY_ANOMALY_TABLE_BASELINE_COLUMN = i18n.translate(
  'xpack.securitySolution.entityAnalytics.entityAnomalies.tab.anomalyTable.baselineColumn',
  { defaultMessage: 'Baseline' }
);

export const ENTITY_ANOMALY_TABLE_ANOMALY_COLUMN = i18n.translate(
  'xpack.securitySolution.entityAnalytics.entityAnomalies.tab.anomalyTable.anomalyColumn',
  { defaultMessage: 'Anomaly' }
);

export const ENTITY_ANOMALY_TABLE_SCORE_COLUMN = i18n.translate(
  'xpack.securitySolution.entityAnalytics.entityAnomalies.tab.anomalyTable.scoreColumn',
  { defaultMessage: 'Anomaly score' }
);

export const ENTITY_ANOMALY_TABLE_DESCRIPTION = i18n.translate(
  'xpack.securitySolution.entityAnalytics.entityAnomalies.tab.anomalyTable.description',
  { defaultMessage: 'Description' }
);

// export const ANOMALIES_TABLE_ACTIONS_COLUMN = i18n.translate(
//   'xpack.securitySolution.entityAnalytics.behavioralAnomalies.table.actionsColumn',
//   { defaultMessage: 'Actions' }
// );

// export const ANOMALIES_TABLE_ROW_ACTION_ADD_TO_TIMELINE = i18n.translate(
//   'xpack.securitySolution.entityAnalytics.behavioralAnomalies.table.rowActions.addToTimeline',
//   { defaultMessage: 'Add to timeline' }
// );

// export const ANOMALIES_TABLE_ROW_ACTION_VIEW_IN_DISCOVER = i18n.translate(
//   'xpack.securitySolution.entityAnalytics.behavioralAnomalies.table.rowActions.viewInDiscover',
//   { defaultMessage: 'View in Discover' }
// );

// export const ANOMALIES_TABLE_ROW_ACTION_VIEW_IN_SMV = i18n.translate(
//   'xpack.securitySolution.entityAnalytics.behavioralAnomalies.table.rowActions.viewInSingleMetricViewer',
//   { defaultMessage: 'View in Single metric viewer' }
// );
