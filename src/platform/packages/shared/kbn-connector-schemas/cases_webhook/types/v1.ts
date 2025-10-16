/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import type { z } from '@kbn/zod';
import type { Logger } from '@kbn/core/server';
import type {
  ExecutorParamsSchema,
  ExecutorSubActionPushParamsSchema,
  ExternalIncidentServiceConfigurationSchema,
  ExternalIncidentServiceSecretConfigurationSchema,
} from '..';

// config
export type CasesWebhookPublicConfigurationType = z.infer<
  typeof ExternalIncidentServiceConfigurationSchema
>;
// secrets
export type CasesWebhookSecretConfigurationType = z.infer<
  typeof ExternalIncidentServiceSecretConfigurationSchema
>;
// params
export type CasesWebhookActionParamsType = z.infer<typeof ExecutorParamsSchema>;

export interface ExternalServiceCredentials {
  config: CasesWebhookPublicConfigurationType;
  secrets: CasesWebhookSecretConfigurationType;
}

export interface ExternalServiceIncidentResponse {
  id: string;
  title: string;
  url: string;
  pushedDate: string;
}
export type Incident = Omit<ExecutorSubActionPushParams['incident'], 'externalId'>;

export type ExecutorParams = z.infer<typeof ExecutorParamsSchema>;
export type ExecutorSubActionPushParams = z.infer<typeof ExecutorSubActionPushParamsSchema>;
export type PushToServiceApiParams = ExecutorSubActionPushParams;

// incident service
export interface ExternalService {
  createComment: (params: CreateCommentParams) => Promise<unknown>;
  createIncident: (params: CreateIncidentParams) => Promise<ExternalServiceIncidentResponse>;
  getIncident: (id: string) => Promise<GetIncidentResponse>;
  updateIncident: (params: UpdateIncidentParams) => Promise<ExternalServiceIncidentResponse>;
}
export interface CreateIncidentParams {
  incident: Incident;
}
export interface UpdateIncidentParams {
  incidentId: string;
  incident: Incident;
}
export interface SimpleComment {
  comment: string;
  commentId: string;
}

export interface CreateCommentParams {
  incidentId: string;
  comment: SimpleComment;
}

export interface ExternalServiceApiHandlerArgs {
  externalService: ExternalService;
}

// incident api
export interface PushToServiceApiHandlerArgs extends ExternalServiceApiHandlerArgs {
  params: PushToServiceApiParams;
  logger: Logger;
}
export interface PushToServiceResponse extends ExternalServiceIncidentResponse {
  comments?: ExternalServiceCommentResponse[];
}

export interface ExternalServiceCommentResponse {
  commentId: string;
  pushedDate: string;
  externalCommentId?: string;
}

export interface GetIncidentResponse {
  id: string;
  title: string;
}

export interface ExternalServiceApi {
  pushToService: (args: PushToServiceApiHandlerArgs) => Promise<PushToServiceResponse>;
}

export type CasesWebhookExecutorResultData = ExternalServiceIncidentResponse;
