/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { EuiLink, EuiText, EuiToolTip } from '@elastic/eui';
import type { TableRow } from './types';
import { truncatedAnchorCss } from './constants';
import { useAnomalySingleMetricViewerUrl } from './use_anomaly_single_metric_viewer_url';

interface AnomalyJobNameProps {
  row: TableRow;
  timeRange: { from: string; to: string };
}

export const AnomalyJobName: React.FC<AnomalyJobNameProps> = ({ row, timeRange }) => {
  const singleMetricViewerUrl = useAnomalySingleMetricViewerUrl(row, timeRange);

  if (!singleMetricViewerUrl) {
    return (
      <EuiToolTip content={row.jobDisplayName} anchorProps={{ css: truncatedAnchorCss }}>
        <EuiText tabIndex={0} size="xs" component="span">
          {row.jobDisplayName}
        </EuiText>
      </EuiToolTip>
    );
  }

  return (
    <EuiToolTip content={row.jobDisplayName} anchorProps={{ css: truncatedAnchorCss }}>
      <EuiText tabIndex={0} size="xs" component="span">
        <EuiLink color="primary" href={singleMetricViewerUrl} target="_blank" external={false}>
          {row.jobDisplayName}
        </EuiLink>
      </EuiText>
    </EuiToolTip>
  );
};
