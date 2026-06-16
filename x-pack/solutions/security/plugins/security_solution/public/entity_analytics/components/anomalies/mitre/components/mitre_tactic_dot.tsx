/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { EuiText, EuiToolTip, useEuiTheme } from '@elastic/eui';
import { css } from '@emotion/react';
import { i18n } from '@kbn/i18n';

interface MitreTacticDotProps {
  anomalyCount?: number;
  detected: boolean;
  isClickable?: boolean;
  isLast?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  showLabel: boolean;
  tactic: string;
}

const anomaliesCountText = (count: number): string =>
  i18n.translate(
    'xpack.securitySolution.entityAnalytics.entityAnomalies.mitre.anomalyCountTooltip',
    {
      defaultMessage: '{count, plural, one {# anomaly} other {# anomalies}}',
      values: { count },
    }
  );

export const MitreTacticDot: React.FC<MitreTacticDotProps> = ({
  anomalyCount = 0,
  detected,
  isClickable = false,
  isLast = false,
  isSelected = false,
  onClick,
  showLabel,
  tactic,
}) => {
  const { euiTheme } = useEuiTheme();
  const color = detected ? euiTheme.colors.danger : euiTheme.colors.subduedText;

  const haloOpacity = isSelected ? 1 : detected ? 0.25 : 0;
  const haloSize = isSelected ? 20 : 16;
  const haloOffset = isSelected ? -6 : -4;

  const handleActivate = isClickable && onClick ? onClick : undefined;

  const dotRow = (
    <div
      css={css`
        position: relative;
        height: 8px;
      `}
    >
      {/* Inner circle */}
      <div
        data-test-subj="mitreInnerCircle"
        css={css`
          position: absolute;
          left: 0;
          top: 0;
          width: 8px;
          height: 8px;
          background: transparent;
          border: 2px solid ${color};
          border-radius: 50%;
          z-index: 2;
        `}
      />
      {/* Outer halo — only fully visible when detected */}
      <div
        data-test-subj="mitreOuterCircle"
        css={css`
          position: absolute;
          left: ${haloOffset}px;
          top: ${haloOffset}px;
          width: ${haloSize}px;
          height: ${haloSize}px;
          background: transparent;
          border: 2px solid ${color};
          border-radius: 50%;
          opacity: ${haloOpacity};
          z-index: 1;
          transition: width 120ms ease, height 120ms ease, opacity 120ms ease, left 120ms ease,
            top 120ms ease;
        `}
      />
      {/* Connector line */}
      <div
        css={
          isLast
            ? css`
                position: absolute;
                left: 0;
                width: 4px;
                top: 3px;
                border-bottom: 1px solid ${euiTheme.colors.lightShade};
                height: 0;
              `
            : css`
                position: absolute;
                left: 0;
                right: 0;
                top: 3px;
                border-bottom: 1px solid ${euiTheme.colors.lightShade};
                height: 0;
              `
        }
      />
    </div>
  );

  const dotRowWithTooltip =
    typeof anomalyCount === 'number' ? (
      <EuiToolTip
        position="top"
        content={
          <div>
            <strong>{tactic}</strong>
            <div>{anomaliesCountText(anomalyCount)}</div>
          </div>
        }
        anchorProps={{
          css: css`
            display: block;
            width: 100%;
          `,
        }}
      >
        {dotRow}
      </EuiToolTip>
    ) : (
      dotRow
    );

  const interactiveProps = handleActivate
    ? {
        role: 'button' as const,
        tabIndex: 0,
        'aria-pressed': isSelected,
        onClick: (e: React.MouseEvent) => {
          e.stopPropagation();
          handleActivate();
        },
        onKeyDown: (e: React.KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            handleActivate();
          }
        },
      }
    : {};

  const interactiveCss = handleActivate
    ? css`
        cursor: pointer;
        &:focus-visible {
          outline: 2px solid ${euiTheme.colors.primary};
          outline-offset: 2px;
          border-radius: 4px;
        }
      `
    : css`
        cursor: default;
      `;

  return (
    <div
      css={css`
        position: relative;
        width: 100%;
        ${interactiveCss};
      `}
      {...interactiveProps}
    >
      {dotRowWithTooltip}
      {showLabel && (
        <div
          css={css`
            margin-top: ${euiTheme.size.s};
            min-width: 0;
          `}
        >
          <EuiToolTip
            content={tactic}
            anchorProps={{
              css: css`
                display: block;
                min-width: 0;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
              `,
            }}
          >
            <EuiText
              size="xs"
              color={detected ? 'danger' : 'subdued'}
              css={css`
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                display: block;
                ${isSelected ? 'font-weight: 600;' : ''}
              `}
            >
              <span>{tactic}</span>
            </EuiText>
          </EuiToolTip>
        </div>
      )}
    </div>
  );
};
