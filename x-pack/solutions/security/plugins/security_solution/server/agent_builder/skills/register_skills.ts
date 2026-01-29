/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { AgentBuilderPluginSetup } from '@kbn/agent-builder-plugin/server';
import { alertAnalysisSkill, getEntityAnalysisSkill } from '.';
import type { EntityAnalyticsRoutesDeps } from '../../lib/entity_analytics/types';

interface RegisterSkillsOpts {
  agentBuilder: AgentBuilderPluginSetup;
  getStartServices: EntityAnalyticsRoutesDeps['getStartServices'];
  ml: EntityAnalyticsRoutesDeps['ml'];
  kibanaVersion: string;
}
/**
 * Registers all security agent builder skills with the agentBuilder plugin
 */
export const registerSkills = async ({
  agentBuilder,
  getStartServices,
  ml,
  kibanaVersion,
}: RegisterSkillsOpts): Promise<void> => {
  agentBuilder.skill.registerSkill(alertAnalysisSkill);
  agentBuilder.skill.registerSkill(getEntityAnalysisSkill({ getStartServices, ml, kibanaVersion }));
};
