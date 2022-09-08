/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { TypeRegistry } from '@kbn/triggers-actions-ui-plugin/public/application/type_registry';
import { registerConnectorTypes } from '../..';
import { ActionTypeModel } from '@kbn/triggers-actions-ui-plugin/public/types';
import { registrationServicesMock } from '@kbn/triggers-actions-ui-plugin/public/mocks';

const ACTION_TYPE_ID = '.xmatters';
let actionTypeModel: ActionTypeModel;

beforeAll(() => {
  const actionTypeRegistry = new TypeRegistry<ActionTypeModel>();
  registerConnectorTypes({ actionTypeRegistry, services: registrationServicesMock });
  const getResult = actionTypeRegistry.get(ACTION_TYPE_ID);
  if (getResult !== null) {
    actionTypeModel = getResult;
  }
});

describe('actionTypeRegistry.get() works', () => {
  test('action type static data is as expected', () => {
    expect(actionTypeModel.id).toEqual(ACTION_TYPE_ID);
    expect(actionTypeModel.actionTypeTitle).toEqual('xMatters data');
  });
});

describe('xmatters action params validation', () => {
  test('action params validation succeeds when action params is valid', async () => {
    const actionParams = {
      alertActionGroupName: 'Small t-shirt',
      signalId: 'c9437cab-6a5b-45e8-bc8a-f4a8af440e97',
      ruleName: 'Test xMatters',
      date: '2022-01-18T19:01:08.818Z',
      severity: 'high',
      spaceId: 'default',
      tags: 'test1, test2',
    };

    expect(await actionTypeModel.validateParams(actionParams)).toEqual({
      errors: { alertActionGroupName: [], signalId: [] },
    });
  });
});
