/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { IRouter } from '@kbn/core/server';
import {
  ConnectorConfigV1,
  ConnectorSecretsV1,
} from '../../../../common/routes/connector/response';
import { ActionsRequestHandlerContext } from '../../../types';
import { ILicenseState } from '../../../lib';
import { BASE_ACTION_API_PATH } from '../../../../common';
import { verifyAccessAndContext } from '../../verify_access_and_context';
import {
  createBodySchemaV1,
  CreateConnectorRequestBodyV1,
  CreateConnectorRequestParamsV1,
  CreateConnectorResponseV1,
  createParamsSchemaV1,
} from '../../../../common/routes/connector/apis/create';
import { transformCreateBodyV1, transformConnectorResultToConnectorResponseV1 } from './transforms';

export const createConnectorRoute = (
  router: IRouter<ActionsRequestHandlerContext>,
  licenseState: ILicenseState
) => {
  router.post(
    {
      path: `${BASE_ACTION_API_PATH}/connector/{id?}`,
      validate: {
        body: createBodySchemaV1,
        params: createParamsSchemaV1,
      },
    },
    router.handleLegacyErrors(
      verifyAccessAndContext(licenseState, async function (context, req, res) {
        const actionsClient = (await context.actions).getActionsClient();

        // Assert versioned inputs
        const createConnectorData: CreateConnectorRequestBodyV1<
          ConnectorConfigV1,
          ConnectorSecretsV1
        > = req.body;
        const params: CreateConnectorRequestParamsV1 = req.params;

        const createdConnector: ConnectorResult<ConnectorConfigV1, ConnectorSecretsV1> =
          (await actionsClient.create<ConnectorConfigV1, ConnectorSecretsV1>({
            action: transformCreateBodyV1<ConnectorConfigV1, ConnectorSecretsV1>(
              createConnectorData
            ),
            options: params,
          })) as ConnectorResult<ConnectorConfigV1, ConnectorSecretsV1>;

        // Assert versioned response type
        const response: CreateConnectorResponseV1<ConnectorConfigV1> = {
          body: transformConnectorResultToConnectorResponseV1<
            ConnectorConfigV1,
            ConnectorSecretsV1
          >(createdConnector),
        };

        return res.ok(response);
        // const action = rewriteBodyReq(req.body);
        // return res.ok({
        //   body: rewriteBodyRes(await actionsClient.create({ action, options: req.params })),
        // });
      })
    )
  );
};
