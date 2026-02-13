/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/**
 * Entity Analytics Risk Score Skill Evaluations — Risk Engine OFF
 *
 * Tests the agent's ability to correctly identify when the risk engine
 * is not enabled and provide appropriate guidance to the user.
 */

import { dataViewRouteHelpersFactory } from '@kbn/test-suites-security-solution-apis/test_suites/entity_analytics/utils';
import { createAlertsIndex } from '@kbn/detections-response-ftr-services/alerts';
import { evaluate } from '../src/evaluate';

// The inline tool ID registered by the entity-analysis skill
const entityAnalysisRiskScoreToolId = 'security.entity_analysis.risk_score';

// Set default evaluators for this spec
const SPEC_EVALUATORS = [
  'ToolUsageOnly',
  'ToolOutputESQL',
  'Groundedness',
  'Relevance',
  'Sequence Accuracy',
];
if (!process.env.SELECTED_EVALUATORS) {
  process.env.SELECTED_EVALUATORS = SPEC_EVALUATORS.join(',');
}

evaluate.describe(
  'Entity Analytics Risk Score Skill — Engine OFF',
  { tag: '@svlSecurity' },
  () => {
    evaluate.beforeAll(async ({ log, esArchiverLoad, supertest }) => {
      await createAlertsIndex(supertest, log);
      await esArchiverLoad(
        'x-pack/solutions/security/test/fixtures/es_archives/security_solution/ecs_compliant'
      );
      const dataView = dataViewRouteHelpersFactory(supertest);
      await dataView.create('security-solution', 'ecs_compliant,auditbeat-*');
    });

    evaluate.afterAll(async ({ supertest }) => {
      const dataView = dataViewRouteHelpersFactory(supertest);
      await dataView.delete('security-solution');
    });

    evaluate(
      'risk score queries when engine is disabled',
      async ({ evaluateDataset }) => {
        await evaluateDataset({
          dataset: {
            name: 'entity-analytics: risk score without data',
            description:
              'Tests that the agent correctly identifies when the risk engine is not enabled and provides guidance.',
            examples: [
              {
                input: {
                  question: 'Which users have the highest risk scores?',
                },
                output: {
                  expected:
                    'The response should: (1) explicitly state that the Risk Engine is not currently enabled so risk score data is unavailable, (2) recommend enabling the Risk Engine to start calculating risk scores, and (3) optionally mention what will be available once enabled such as risk scores on a 0-100 scale, risk levels, and risk inputs from alerts. The response should be grounded in the tool output and not fabricate any data.',
                },
                metadata: {
                  expectedOnlyToolId: entityAnalysisRiskScoreToolId,
                },
              },
              {
                input: {
                  question:
                    "Show me how user-1's risk score has changed over the last 90 days",
                },
                output: {
                  expected:
                    'The response should: (1) explicitly state that the Risk Engine is not currently enabled so risk score data and history are unavailable, (2) recommend enabling the Risk Engine so that risk score history can be tracked over time, and (3) optionally mention that once enabled, risk scores will be computed on a 0-100 scale and historical trends can be analyzed. The response should be grounded in the tool output and not fabricate any data.',
                },
                metadata: {
                  expectedOnlyToolId: entityAnalysisRiskScoreToolId,
                },
              },
              {
                input: {
                  question: 'Which 10 users have the highest risk scores right now?',
                },
                output: {
                  expected:
                    'The response should: (1) explicitly state that the Risk Engine is not currently enabled so risk score data is unavailable, (2) recommend enabling the Risk Engine to access user risk score rankings, and (3) optionally mention that once enabled, users will have normalized risk scores (0-100) and risk levels that can be used for ranking. The response should be grounded in the tool output and not fabricate any data.',
                },
                metadata: {
                  expectedOnlyToolId: entityAnalysisRiskScoreToolId,
                },
              },
            ],
          },
        });
      }
    );
  }
);
