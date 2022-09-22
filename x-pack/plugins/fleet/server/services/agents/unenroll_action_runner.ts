/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import uuid from 'uuid';
import type { SavedObjectsClientContract, ElasticsearchClient } from '@kbn/core/server';

import { intersection } from 'lodash';

import { AGENT_ACTIONS_RESULTS_INDEX } from '../../../common';

import type { Agent, BulkActionResult } from '../../types';

import { FleetError, HostedAgentPolicyRestrictionRelatedError } from '../../errors';

import { invalidateAPIKeys } from '../api_keys';

import { appContextService } from '../app_context';

import { ActionRunner } from './action_runner';

import { errorsToResults, bulkUpdateAgents } from './crud';
import {
  bulkCreateAgentActionResults,
  createAgentAction,
  getUnenrollAgentActions,
} from './actions';
import { getHostedPolicies, isHostedAgent } from './hosted_agent';
import { BulkActionTaskType } from './bulk_actions_resolver';

export class UnenrollActionRunner extends ActionRunner {
  protected async processAgents(agents: Agent[]): Promise<{ items: BulkActionResult[] }> {
    return await unenrollBatch(this.soClient, this.esClient, agents, this.actionParams!, true);
  }

  protected getTaskType() {
    return BulkActionTaskType.UNENROLL_RETRY;
  }

  protected getActionType() {
    return 'UNENROLL';
  }
}

export function isAgentUnenrolled(agent: Agent, revoke?: boolean): boolean {
  return Boolean(
    (revoke && agent.unenrolled_at) ||
      (!revoke && (agent.unenrollment_started_at || agent.unenrolled_at))
  );
}

export async function unenrollBatch(
  soClient: SavedObjectsClientContract,
  esClient: ElasticsearchClient,
  givenAgents: Agent[],
  options: {
    force?: boolean;
    revoke?: boolean;
    actionId?: string;
    total?: number;
  },
  skipSuccess?: boolean
): Promise<{ items: BulkActionResult[] }> {
  const hostedPolicies = await getHostedPolicies(soClient, givenAgents);
  const outgoingErrors: Record<Agent['id'], Error> = {};

  // And which are allowed to unenroll
  const agentsToUpdate = options.force
    ? givenAgents
    : givenAgents.reduce<Agent[]>((agents, agent) => {
        if (isAgentUnenrolled(agent, options.revoke)) {
          outgoingErrors[agent.id] = new FleetError(`Agent ${agent.id} already unenrolled`);
        } else if (isHostedAgent(hostedPolicies, agent)) {
          outgoingErrors[agent.id] = new HostedAgentPolicyRestrictionRelatedError(
            `Cannot unenroll ${agent.id} from a hosted agent policy ${agent.policy_id}`
          );
        } else {
          agents.push(agent);
        }
        return agents;
      }, []);

  const actionId = options.actionId ?? uuid();
  const errorCount = Object.keys(outgoingErrors).length;
  const total = options.total ?? givenAgents.length;

  const agentIds = agentsToUpdate.map((agent) => agent.id);

  const now = new Date().toISOString();
  if (options.revoke) {
    // Get all API keys that need to be invalidated
    await invalidateAPIKeysForAgents(agentsToUpdate);

    await updateActionsForForceUnenroll(esClient, agentIds, actionId, total);
  } else {
    // Create unenroll action for each agent
    await createAgentAction(esClient, {
      id: actionId,
      agents: agentIds,
      created_at: now,
      type: 'UNENROLL',
      total,
    });
  }

  if (errorCount > 0) {
    appContextService
      .getLogger()
      .info(
        `Skipping ${errorCount} agents, as failed validation (cannot unenroll from a hosted policy or already unenrolled)`
      );

    // writing out error result for those agents that failed validation, so the action is not going to stay in progress forever
    await bulkCreateAgentActionResults(
      esClient,
      Object.keys(outgoingErrors).map((agentId) => ({
        agentId,
        actionId,
        error: outgoingErrors[agentId].message,
      }))
    );
  }

  // Update the necessary agents
  const updateData = options.revoke
    ? { unenrolled_at: now, active: false }
    : { unenrollment_started_at: now };

  await bulkUpdateAgents(
    esClient,
    agentsToUpdate.map(({ id }) => ({ agentId: id, data: updateData }))
  );

  return {
    items: errorsToResults(givenAgents, outgoingErrors, undefined, skipSuccess),
  };
}

export async function updateActionsForForceUnenroll(
  esClient: ElasticsearchClient,
  agentIds: string[],
  actionId: string,
  total: number
) {
  // creating an unenroll so that force unenroll shows up in activity
  await createAgentAction(esClient, {
    id: actionId,
    agents: [],
    created_at: new Date().toISOString(),
    type: 'FORCE_UNENROLL',
    total,
  });
  await bulkCreateAgentActionResults(
    esClient,
    agentIds.map((agentId) => ({
      agentId,
      actionId,
    }))
  );

  // updating action results for those agents that are there in a pending unenroll action
  const unenrollActions = await getUnenrollAgentActions(esClient);
  for (const action of unenrollActions) {
    const commonAgents = intersection(action.agents, agentIds);
    if (commonAgents.length > 0) {
      // filtering out agents with action results
      const agentsToUpdate = await getAgentsWithoutActionResults(
        esClient,
        action.action_id!,
        commonAgents
      );
      if (agentsToUpdate.length > 0) {
        await bulkCreateAgentActionResults(
          esClient,
          agentsToUpdate.map((agentId) => ({
            agentId,
            actionId: action.action_id!,
          }))
        );
      }
    }
  }
}

async function getAgentsWithoutActionResults(
  esClient: ElasticsearchClient,
  actionId: string,
  commonAgents: string[]
): Promise<string[]> {
  try {
    const res = await esClient.search({
      index: AGENT_ACTIONS_RESULTS_INDEX,
      query: {
        bool: {
          must: [{ term: { action_id: actionId } }, { terms: { agent_id: commonAgents } }],
        },
      },
      size: commonAgents.length,
    });
    const agentsToUpdate = commonAgents.filter(
      (agentId) => !res.hits.hits.find((hit) => (hit._source as any)?.agent_id === agentId)
    );
    return agentsToUpdate;
  } catch (err) {
    if (err.statusCode === 404) {
      // .fleet-actions-results does not yet exist
      appContextService.getLogger().debug(err);
    } else {
      throw err;
    }
  }
  return commonAgents;
}

export async function invalidateAPIKeysForAgents(agents: Agent[]) {
  const apiKeys = agents.reduce<string[]>((keys, agent) => {
    if (agent.access_api_key_id) {
      keys.push(agent.access_api_key_id);
    }
    if (agent.default_api_key_id) {
      keys.push(agent.default_api_key_id);
    }
    if (agent.default_api_key_history) {
      agent.default_api_key_history.forEach((apiKey) => keys.push(apiKey.id));
    }
    return keys;
  }, []);

  if (apiKeys.length) {
    await invalidateAPIKeys(apiKeys);
  }
}
