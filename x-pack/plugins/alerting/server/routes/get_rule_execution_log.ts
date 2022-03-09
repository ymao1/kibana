/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { IRouter } from 'kibana/server';
import { schema } from '@kbn/config-schema';
import { ILicenseState } from '../lib';
import { GetExecutionLogByIdParams } from '../rules_client';
import { RewriteRequestCase, verifyAccessAndContext } from './lib';
import { AlertingRequestHandlerContext, INTERNAL_BASE_ALERTING_API_PATH } from '../types';

const paramSchema = schema.object({
  id: schema.string(),
});

const querySchema = schema.object({
  date_start: schema.string(),
  date_end: schema.maybe(schema.string()),
  filter: schema.maybe(schema.string()),
  per_page: schema.number({ defaultValue: 10, min: 1 }),
  page: schema.number({ defaultValue: 1, min: 1 }),
  sort_field: schema.oneOf([schema.literal('timestamp'), schema.literal('duration')], {
    defaultValue: 'timestamp',
  }),
  sort_order: schema.oneOf([schema.literal('asc'), schema.literal('desc')], {
    defaultValue: 'desc',
  }),
});

const rewriteReq: RewriteRequestCase<GetExecutionLogByIdParams> = ({
  date_start: dateStart,
  date_end: dateEnd,
  per_page: perPage,
  sort_field: sortField,
  sort_order: sortOrder,
  ...rest
}) => ({
  ...rest,
  dateStart,
  dateEnd,
  perPage,
  sortField,
  sortOrder,
});

export const getRuleExecutionLogRoute = (
  router: IRouter<AlertingRequestHandlerContext>,
  licenseState: ILicenseState
) => {
  router.get(
    {
      path: `${INTERNAL_BASE_ALERTING_API_PATH}/rule/{id}/_execution_log`,
      validate: {
        params: paramSchema,
        query: querySchema,
      },
    },
    router.handleLegacyErrors(
      verifyAccessAndContext(licenseState, async function (context, req, res) {
        const rulesClient = context.alerting.getRulesClient();
        const { id } = req.params;
        return res.ok({
          body: await rulesClient.getExecutionLogForRule(rewriteReq({ id, ...req.query })),
        });
      })
    )
  );
};
