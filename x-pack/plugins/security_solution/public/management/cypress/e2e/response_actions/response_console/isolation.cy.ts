/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { PolicyData } from '../../../../../../common/endpoint/types';
import type { CreateAndEnrollEndpointHostResponse } from '../../../../../../scripts/endpoint/common/endpoint_host_services';
import {
  openResponseConsoleFromEndpointList,
  performCommandInputChecks,
  submitCommand,
  waitForCommandToBeExecuted,
  waitForEndpointListPageToBeLoaded,
} from '../../../tasks/response_console';
import type { IndexedFleetEndpointPolicyResponse } from '../../../../../../common/endpoint/data_loaders/index_fleet_endpoint_policy';
import { createAgentPolicyTask, getEndpointIntegrationVersion } from '../../../tasks/fleet';
import {
  checkEndpointListForOnlyIsolatedHosts,
  checkEndpointListForOnlyUnIsolatedHosts,
} from '../../../tasks/isolate';

import { login } from '../../../tasks/login';
import { enableAllPolicyProtections } from '../../../tasks/endpoint_policy';
import { createEndpointHost } from '../../../tasks/create_endpoint_host';
import { deleteAllLoadedEndpointData } from '../../../tasks/delete_all_endpoint_data';

describe('Response console', { tags: ['@ess', '@serverless'] }, () => {
  beforeEach(() => {
    login();
  });

  describe('Host Isolation: isolate and release an endpoint', () => {
    let indexedPolicy: IndexedFleetEndpointPolicyResponse;
    let policy: PolicyData;
    let createdHost: CreateAndEnrollEndpointHostResponse;

    before(() => {
      getEndpointIntegrationVersion().then((version) =>
        createAgentPolicyTask(version).then((data) => {
          indexedPolicy = data;
          policy = indexedPolicy.integrationPolicies[0];

          return enableAllPolicyProtections(policy.id).then(() => {
            // Create and enroll a new Endpoint host
            return createEndpointHost(policy.policy_id).then((host) => {
              createdHost = host as CreateAndEnrollEndpointHostResponse;
            });
          });
        })
      );
    });

    after(() => {
      if (createdHost) {
        cy.task('destroyEndpointHost', createdHost);
      }

      if (indexedPolicy) {
        cy.task('deleteIndexedFleetEndpointPolicies', indexedPolicy);
      }

      if (createdHost) {
        deleteAllLoadedEndpointData({ endpointAgentIds: [createdHost.agentId] });
      }
    });

    it('should isolate host from response console', () => {
      const command = 'isolate';
      waitForEndpointListPageToBeLoaded(createdHost.hostname);
      checkEndpointListForOnlyUnIsolatedHosts();
      openResponseConsoleFromEndpointList();
      performCommandInputChecks(command);
      submitCommand();
      waitForCommandToBeExecuted(command);
      waitForEndpointListPageToBeLoaded(createdHost.hostname);
      checkEndpointListForOnlyIsolatedHosts();
    });

    it('should release host from response console', () => {
      const command = 'release';
      waitForEndpointListPageToBeLoaded(createdHost.hostname);
      checkEndpointListForOnlyIsolatedHosts();
      openResponseConsoleFromEndpointList();
      performCommandInputChecks(command);
      submitCommand();
      waitForCommandToBeExecuted(command);
      waitForEndpointListPageToBeLoaded(createdHost.hostname);
      checkEndpointListForOnlyUnIsolatedHosts();
    });
  });
});
