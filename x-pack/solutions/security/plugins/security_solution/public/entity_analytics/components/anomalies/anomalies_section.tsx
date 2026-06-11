/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import {
  useEuiTheme,
  useEuiFontSize,
  EuiAccordion,
  EuiTitle,
  EuiSpacer,
  EuiHorizontalRule,
} from '@elastic/eui';
import { css } from '@emotion/react';
import React from 'react';
import {
  BEHAVIORAL_ANOMALIES_SECTION_TITLE,
  BEHAVIORAL_ANOMALIES_OVERVIEW_TIMEFRAME,
} from './translations';
import type { GetAnomalyOverviewResponse } from '../../../../common/api/entity_analytics';
import type { EntityDetailsPath } from '../../../flyout/entity_details/shared/components/left_panel/left_panel_header';
import { AnomaliesOverview } from './anomalies_overview';

interface AnomaliesSectionProps {
  data: GetAnomalyOverviewResponse;
  entityId: string;
  isPreviewMode?: boolean;
  openDetailsPanel: (path: EntityDetailsPath) => void;
}

export const AnomaliesSection: React.FC<AnomaliesSectionProps> = (props) => {
  const { euiTheme } = useEuiTheme();
  const xsFontSize = useEuiFontSize('xs').fontSize;

  return (
    <>
      <EuiAccordion
        id="anomalies_section"
        initialIsOpen
        data-test-subj="anomalies-section-data-test-subj"
        buttonProps={{
          'data-test-subj': 'behavioral-anomalies-accordion-button',
          css: css`
            color: ${euiTheme.colors.primary};
          `,
        }}
        buttonContent={
          <EuiTitle size="xs">
            <h3>{BEHAVIORAL_ANOMALIES_SECTION_TITLE}</h3>
          </EuiTitle>
        }
        extraAction={
          <span
            data-test-subj="behavioral-anomalies-overview-timeframe"
            css={css`
              font-size: ${xsFontSize};
              color: ${euiTheme.colors.textSubdued};
            `}
          >
            {BEHAVIORAL_ANOMALIES_OVERVIEW_TIMEFRAME}
          </span>
        }
      >
        <EuiSpacer size="m" />
        <AnomaliesOverview {...props} />
      </EuiAccordion>
      <EuiHorizontalRule />
    </>
  );
};
