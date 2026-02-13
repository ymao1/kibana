/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/**
 * Entity Analytics Risk Score Skill Evaluations — Risk Engine ON
 *
 * Tests the agent's ability to use the entity analysis risk score tool
 * for querying, ranking, and analyzing entity risk scores when the
 * risk engine is enabled and populated with data.
 *
 * Supported operations:
 * - Query risk scores for entities (users, hosts)
 * - Rank entities by risk score
 * - Analyze risk score trends over time
 */

import { v4 as uuidv4 } from 'uuid';
import {
  buildDocument,
  waitForRiskScoresToBePresent,
  dataViewRouteHelpersFactory,
  deleteAllRiskScores,
} from '@kbn/test-suites-security-solution-apis/test_suites/entity_analytics/utils';
import {
  createRule,
  deleteAllRules,
  getRuleForAlertTesting,
  waitForRuleSuccess,
} from '@kbn/detections-response-ftr-services/rules';
import {
  deleteAllAlerts,
  createAlertsIndex,
  waitForAlertsToBePresent,
} from '@kbn/detections-response-ftr-services/alerts';
import { dataGeneratorFactory } from '@kbn/test-suites-security-solution-apis/test_suites/detections_response/utils';
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
  'Entity Analytics Risk Score Skill — Engine ON',
  { tag: '@svlSecurity' },
  () => {
    const userId = uuidv4();

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

    evaluate.describe('with risk score data', () => {
      evaluate.beforeAll(async ({ log, esClient, supertest, quickApiClient }) => {
        const { indexListOfDocuments } = dataGeneratorFactory({
          es: esClient,
          index: 'ecs_compliant',
          log,
        });
        const userDocs = Array(10)
          .fill({})
          .map((_, index) => buildDocument({ user: { name: `user-${index}` } }, userId));
        await indexListOfDocuments(userDocs);

        // Create a detection rule with a fast interval (5s instead of the default 5m)
        // to ensure the rule executes quickly in the eval environment.
        const rule = getRuleForAlertTesting(['ecs_compliant'], uuidv4());
        const { id } = await createRule(supertest, log, {
          ...rule,
          risk_score: 40,
          query: `id: ${userId}`,
          max_signals: 100,
          interval: '5s',
        });
        await waitForRuleSuccess({ supertest, log, id });
        await waitForAlertsToBePresent(supertest, log, 10, [id]);

        await quickApiClient.initRiskEngine();
        await waitForRiskScoresToBePresent({ es: esClient, log, scoreCount: 10 });
      });

      evaluate.afterAll(async ({ quickApiClient, supertest, log, esClient }) => {
        await quickApiClient.cleanUpRiskEngine();
        await deleteAllRiskScores(log, esClient);
        await deleteAllAlerts(supertest, log, esClient);
        await deleteAllRules(supertest, log);
      });

      evaluate('risk score queries with active data', async ({ evaluateDataset }) => {
        await evaluateDataset({
          dataset: {
            name: 'entity-analytics: risk score',
            description:
              'Tests that the agent correctly queries and presents entity risk score data.',
            examples: [
              {
                input: {
                  question: 'Which users have the highest risk scores?',
                },
                output: {
                  expected:
                    'A ranked list or table of users by risk score. The response should include user names (user-0 through user-9) and their normalized risk scores (calculated_score_norm around 15.43, on a 0-100 scale). Risk levels should be included (all "Unknown"). The response may note that all 10 users share the same risk score, indicating they are equally ranked. The response may add brief observations such as the scores being relatively low, the risk levels being Unknown due to unassigned criticality, and suggestions like configuring criticality or investigating risk inputs.',
                },
                metadata: {
                  expectedOnlyToolId: entityAnalysisRiskScoreToolId,
                  expectedEsql: `FROM risk-score.risk-score-latest-default
                  | WHERE user.name IS NOT NULL
                  | SORT user.risk.calculated_score_norm DESC
                  | KEEP user.name, user.risk.calculated_score_norm, user.risk.calculated_level`,
                },
              },
              {
                input: {
                  question:
                    "Show me how user-1's risk score has changed over the last 90 days",
                },
                output: {
                  expected:
                    "User-1's risk score data from the risk score time series index. The response should present user-1's current normalized risk score (around 15.43 on a 0-100 scale) and risk level (Unknown). Since only a single data point exists, the response should note that more historical data is needed to show meaningful trends over time and should NOT fabricate trends or claim stability from insufficient data. The response may offer suggestions such as checking back later for trend data or reviewing recent alerts contributing to the score.",
                },
                metadata: {
                  expectedOnlyToolId: entityAnalysisRiskScoreToolId,
                  expectedEsql: `FROM risk-score.risk-score-default
                  | WHERE user.name == "user-1"`,
                },
              },
              {
                input: {
                  question: 'Which 10 users have the highest risk scores right now?',
                },
                output: {
                  expected:
                    'A list or table of 10 users ranked by normalized risk score (calculated_score_norm around 15.43, 0-100 scale) in descending order. The response should include user names (user-0 through user-9), risk scores, and risk levels (all "Unknown"). The response may note that all 10 users have the same risk score, indicating they are equally ranked with relatively low risk. The response may include brief observations about the uniform scores and Unknown risk levels, and may suggest configuring criticality levels or investigating risk inputs for better prioritization.',
                },
                metadata: {
                  expectedOnlyToolId: entityAnalysisRiskScoreToolId,
                  expectedEsql: `FROM risk-score.risk-score-latest-default
                  | WHERE user.name IS NOT NULL
                  | SORT user.risk.calculated_score_norm DESC
                  | KEEP user.name, user.risk.calculated_score_norm, user.risk.calculated_level
                  | LIMIT 10`,
                },
              },
            ],
          },
        });
      });
    });
  }
);
