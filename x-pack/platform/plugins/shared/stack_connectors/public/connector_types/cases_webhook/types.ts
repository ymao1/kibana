/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { UserConfiguredActionConnector } from '@kbn/triggers-actions-ui-plugin/public/types';
import type { Config, Secrets, PushActionParams } from '@kbn/connector-schemas/cases_webhook';

export interface CasesWebhookActionParams {
  subAction: string;
  subActionParams: PushActionParams;
}

export type CasesWebhookConfig = Config;

export type CasesWebhookSecrets = Secrets;

export type CasesWebhookActionConnector = UserConfiguredActionConnector<
  CasesWebhookConfig,
  CasesWebhookSecrets
>;
