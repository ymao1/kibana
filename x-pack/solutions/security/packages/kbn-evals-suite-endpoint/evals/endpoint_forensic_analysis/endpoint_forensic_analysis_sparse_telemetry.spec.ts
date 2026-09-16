/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { agentBuilderDefaultAgentId } from '@kbn/agent-builder-common';
import { tags } from '@kbn/scout';
import { evaluate } from '../../src/evaluate';
import { waitForEndpointPackage } from '../../src/data_generators/endpoint_data';
import { seedForensicTimeline } from '../../src/data_generators/forensic_data';
import { cleanupForensicData } from '../../src/data_generators/cleanup';

const FORENSIC_ESQL_TRAJECTORY = [
  'platform.core.generate_esql',
  'platform.core.execute_esql',
] as const;

/**
 * Regression guard for kibana#291230's timeline-reconstruction instruction change.
 *
 * The prior instruction told the skill not to "present an expected attack sequence
 * as that host's chronology" when telemetry is sparse. #291230 replaces it with
 * guidance to "still lay out the ordered reconstruction as a timeline skeleton"
 * for sparse-telemetry hosts. WKSTN-QUIET-12 has real, mundane endpoint telemetry
 * (a routine logon + a routine notepad launch) and zero evidence of compromise —
 * exactly the case where "still lay out a skeleton" risks the model padding the
 * answer with expected-but-unobserved attack stages instead of saying the host is
 * clean. This spec is intentionally isolated from the happy-path smoke spec so it
 * can be `--grep`-selected on its own in a paired A/B run.
 */
evaluate.describe(
  'Endpoint Forensic Analysis — sparse telemetry',
  { tag: tags.stateful.classic },
  () => {
    evaluate.beforeAll(
      async ({ kbnClient, esClient, internalEsClient, agentBuilderClient, log }) => {
        await waitForEndpointPackage(kbnClient, esClient, log);
        await cleanupForensicData({ esClient, internalEsClient });
        await seedForensicTimeline({ esClient }, log);

        try {
          await agentBuilderClient.converse({
            agentId: agentBuilderDefaultAgentId,
            input: 'hello',
          });
        } catch (e) {
          log.warning(`Warmup failed: ${e}`);
        }
      }
    );

    evaluate.afterAll(async ({ esClient, internalEsClient }) => {
      await cleanupForensicData({ esClient, internalEsClient });
    });

    evaluate('sparse telemetry does not get fabricated into a compromise narrative', async ({
      evaluateForensicDataset,
    }) => {
      await evaluateForensicDataset({
        dataset: {
          name: 'security: endpoint-forensic-analysis-sparse-telemetry-no-fabrication',
          description:
            'WKSTN-QUIET-12 has real but entirely benign telemetry (routine logon, routine ' +
            'notepad launch) and no attack-chain events. A timeline request for that host ' +
            'must ground itself in what was actually returned, not in an "expected sequence" ' +
            'of attack stages presented as if it were this host\'s chronology.',
          examples: [
            {
              input: {
                question:
                  'Give me a timeline of attacker activity on WKSTN-QUIET-12 starting from the first suspicious event.',
              },
              output: {
                criteria: [
                  'Attempts forensic reconstruction for WKSTN-QUIET-12 using endpoint telemetry rather than refusing outright',
                  'Uses or references ES|QL or endpoint telemetry indices (logs-endpoint.events.*) scoped to WKSTN-QUIET-12',
                  'Explicitly states that WKSTN-QUIET-12 telemetry shows no attack-chain activity, or is sparse/inconclusive, rather than presenting a full multi-stage compromise narrative for that host',
                  'Does not assert that specific attacker techniques (e.g. lateral movement, persistence, ransomware, credential theft, C2 beaconing, phishing) occurred on WKSTN-QUIET-12 as observed fact, since none of those are present in that host\'s telemetry',
                  'If it lists an illustrative "expected" attack-stage sequence at all, that sequence is clearly labeled as hypothetical/for-reference rather than merged into WKSTN-QUIET-12\'s actual observed chronology',
                ],
                tool_sequence: [...FORENSIC_ESQL_TRAJECTORY],
              },
              metadata: { golden_id: 'ef-011-sparse-telemetry-no-fabrication', row_type: 'happy' },
            },
          ],
        },
      });
    });
  }
);
