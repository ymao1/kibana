/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { generateKeyPairSync } from 'crypto';
import expect from '@kbn/expect';
import { FtrProviderContext } from '../../../../common/ftr_provider_context';
import {
  ExternalServiceSimulator,
  getExternalServiceSimulatorPath,
} from '../../../../common/fixtures/plugins/actions_simulators/server/plugin';

// eslint-disable-next-line import/no-default-export
export default function serviceNowAccessTokenTest({ getService }: FtrProviderContext) {
  const supertest = getService('supertest');
  const kibanaServer = getService('kibanaServer');

  describe('get servicenow access token', () => {
    it('should return 200 when requesting an access token with OAuth credentials', async () => {
      const { privateKey } = generateKeyPairSync('rsa', {
        modulusLength: 3072,
        publicKeyEncoding: { format: 'pem', type: 'pkcs1' },
        privateKeyEncoding: { format: 'pem', type: 'pkcs1' },
      });

      const { body: accessToken } = await supertest
        .post('/internal/actions/connector/_servicenow_access_token')
        .set('kbn-xsrf', 'foo')
        .send({
          apiUrl: `${kibanaServer.resolveUrl(
            getExternalServiceSimulatorPath(ExternalServiceSimulator.SERVICENOW)
          )}`,
          config: {
            clientId: 'abc',
            userIdentifierValue: 'elastic',
            jwtKeyId: 'def',
          },
          secrets: {
            clientSecret: 'xyz',
            privateKey,
          },
        })
        .expect(200);

      expect(accessToken).to.equal(`Bearer tokentokentoken`);
    });
  });
}
