/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { TypeRegistry } from '@kbn/triggers-actions-ui-plugin/public/application/type_registry';
import { registerConnectorTypes } from '../..';
import { ActionTypeModel as ConnectorTypeModel } from '@kbn/triggers-actions-ui-plugin/public/types';
import { registrationServicesMock } from '@kbn/triggers-actions-ui-plugin/public/mocks';

const CONNECTOR_TYPE_ID = '.cases-webhook';
let connectorTypeModel: ConnectorTypeModel;

beforeAll(() => {
  const connectorTypeRegistry = new TypeRegistry<ConnectorTypeModel>();
  registerConnectorTypes({ connectorTypeRegistry, services: registrationServicesMock });
  const getResult = connectorTypeRegistry.get(CONNECTOR_TYPE_ID);
  if (getResult !== null) {
    connectorTypeModel = getResult;
  }
});

describe('connectorTypeRegistry.get() works', () => {
  test('connector type static data is as expected', () => {
    expect(connectorTypeModel.id).toEqual(CONNECTOR_TYPE_ID);
    expect(connectorTypeModel.iconClass).toEqual('logoWebhook');
  });
});

describe('webhook action params validation', () => {
  test('action params validation succeeds when action params is valid', async () => {
    const actionParams = {
      subActionParams: { incident: { title: 'some title {{test}}' }, comments: [] },
    };

    expect(await connectorTypeModel.validateParams(actionParams)).toEqual({
      errors: { 'subActionParams.incident.title': [] },
    });
  });

  test('params validation fails when body is not valid', async () => {
    const actionParams = {
      subActionParams: { incident: { title: '' }, comments: [] },
    };

    expect(await connectorTypeModel.validateParams(actionParams)).toEqual({
      errors: {
        'subActionParams.incident.title': ['Title is required.'],
      },
    });
  });
});
