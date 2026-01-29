/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { defineSkillType } from '@kbn/agent-builder-server/skills/type_definition';
import type { EntityAnalyticsRoutesDeps } from '../../../lib/entity_analytics/types';
import {
  getAnomalyDetectionInlineTool,
  // getAssetCriticalityInlineTool,
  getEntityStoreInlineTool,
  // getPrivilegedUserMonitoringInlineTool,
  getRiskScoreInlineTool,
} from './inline_tools';

export interface EntityAnalysisSkillsContext {
  getStartServices: EntityAnalyticsRoutesDeps['getStartServices'];
  ml: EntityAnalyticsRoutesDeps['ml'];
  kibanaVersion: string;
}
export const getEntityAnalysisSkill = (ctx: EntityAnalysisSkillsContext) =>
  defineSkillType({
    id: 'entity-analysis',
    name: 'entity-analysis',
    basePath: 'skills/security/entities',
    description: `Comprehensive guide to analyze user, host, service and generic security entities, including their risk scores, behaviors and anomalies as well as asset criticality, entity store, privileged user and watchlist data`,
    body: `# Entity Analysis Guide

This skill helps generate queries based on natural language threat hunting questions about user, host, service and generic entities using **Entity Analytics** data:

- **Risk Scores** (who is riskiest, how risk changed over time, what contributed)
- **Anomalies** (unusual behavior detected from ML jobs)
- **Asset criticality** (critical assets / criticality levels)
- **Entity Store** (profile data for users/hosts/services/generic entities, identity, attributes, behaviors, relationships)
- **Privileged User Monitoring** (who is privileged and why)

## Important dependencies
- Risk score questions require the **Risk Engine** to be enabled and risk indices to exist.
- Anomaly questions require relevant **ML jobs** to be running and producing data (ML anomalies indices).

## Tool Selection Decision Tree

Choose the right tool based on what you need:

### 1. Anomaly Detection Tool
Use \`security.entity_analysis.anomaly_detection\` when you need to generate queries to find:
- ML-detected anomalies related to specific entities
- Unusual access patterns, configurations, logins and other behaviors
- Anomalous behavior for users, hosts, services, or generic entities
- Accounts and users with suspicious login patterns

**Example questions:**

- "Show me entities with anomalous behavior in the last 24h"
- "Which service accounts have unusual access patterns?"
- "Show users who downloaded unusually large data"
- "Are there any unusual access patterns after hours?"
- "Show users logged in from multiple locations"
- "Are there connections suggesting lateral movement?"
- "Show accounts performing unusual administrative actions"
- "Which users uploaded data to external domains?"
- "Show unusual access attempts to privileged accounts"
- "Show me users with suspicious login patterns"
- "Which accounts have downloaded more than 1GB this week?"
- "Is anyone accessing sensitive data from new locations?"

**Key parameters:**

- \`entityType\`: host, user, service, or generic
- \`prompt\`: prompt or question that calling this tool will help to answer
- \`queryExtraContext\`: additional context from previous chat messages like an ESQL filter to include in the query generation

### 2. Search Entity Tool
Use \`security.entity_analysis.risk_score\` when you need:
- Find entities matching specific criteria
- Filter by risk levels (Critical, High, Moderate, Low, Unknown)
- Filter by asset criticality (extreme_impact, high_impact, medium_impact, low_impact)
- Filter by attributes or behaviors
- Find entities with anomalous behavior
- Sort results by risk score, activity time, or name

**Example questions:**

- "What are the riskiest hosts that are high impact?"
- "Show me privileged users with high risk scores"
- "Find all entities that have been brute force victims"
- "Which service accounts have unusual access patterns?"
- "Show me users with new country logins"
- "Show me the behavioral timeline for this entity"

**Key parameters:**

- \`entityTypes\`: Array of entity types to search
- \`riskLevels\`: Filter by risk levels
- \`assetCriticality\`: Filter by asset criticality
- \`attributes\`: Filter by privileged, managed, mfa_enabled
- \`behaviors\`: Filter by brute_force_victim, new_country_login, used_usb_device
- \`sortBy\`: risk_score, last_activity, first_seen, name
- \`limit\`: Number of results (default 10, max 100)

## Best Practices

### Risk Score Interpretation
- Always use \`calculated_score_norm\` (0-100) when reporting risk scores
- Risk levels: Critical (highest), High, Moderate, Low, Unknown
- Higher scores indicate greater risk to the organization

### Entity Investigation Workflow
1. Start with risk score to assess the entity's current risk level
2. Use entity_store_get to understand the entity's profile and relationships
3. If investigating changes, use entity_store_snapshot to compare historical data
4. Use entity_store_search to find similar or related entities

## Supported Question Patterns
| Question Pattern | Tool to Use |
|------------------|-------------|
| "Which [users/hosts] have the highest risk scores?" | entity_risk_score with identifier "*" |
| "What is [entity]'s risk score?" | entity_risk_score with specific identifier |
| "What do we know about [entity]?" | entity_store_get |
| "Show me [entity type] with [risk level] risk" | entity_store_search with riskLevels filter |
| "Find [entity type] that are [high_impact/privileged]" | entity_store_search with filters |
| "What did [entity] look like on [date]?" | entity_store_snapshot |
| "Has [entity]'s risk changed?" | entity_store_snapshot with comparison |
| "Show users logged in from multiple locations" | entity_store_search with new_country_login behavior |
| "Which accounts have unusual patterns?" | entity_store_search with behaviors filter |
`,
    getInlineTools: () => [
      getAnomalyDetectionInlineTool(ctx),
      // getAssetCriticalityInlineTool(ctx),
      getEntityStoreInlineTool(ctx),
      // getPrivilegedUserMonitoringInlineTool(ctx),
      getRiskScoreInlineTool(ctx),
    ],
  });
