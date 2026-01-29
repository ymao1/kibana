/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { servers as defaultSecurityConfig } from '../../../default/stateful/stateful.config';
import type { ScoutServerConfig } from '../../../../../types';

export const servers: ScoutServerConfig = {
  ...defaultSecurityConfig,
  kbnTestServer: {
    ...defaultSecurityConfig.kbnTestServer,
    serverArgs: [
      ...defaultSecurityConfig.kbnTestServer.serverArgs,
      '--feature_flags.overrides.aiAssistant.aiAgents.enabled=true',
      `--xpack.actions.preconfigured=${JSON.stringify({
        gpt41Azure: {
          name: 'GPT-4.1',
          actionTypeId: '.gen-ai',
          config: {
            apiUrl:
              'https://ai-jamesmistraltesting147387030826.cognitiveservices.azure.com/openai/deployments/gpt-4.1/chat/completions?api-version=2025-01-01-preview',
            apiProvider: 'Azure OpenAI',
          },
          secrets: {
            apiKey: 'bea0e8657bf64b679950ada101ed1634',
          },
        },
      })}`,
    ],
  },
};
