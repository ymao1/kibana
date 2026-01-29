/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { platformCoreTools } from '@kbn/agent-builder-common/tools';
import type { SkillsService } from '@kbn/agent-builder-server/runner';

export const skillInstructions = (skills: SkillsService): string => {
  const accessibleSkills = skills.list();
  const description =
    accessibleSkills.length === 0
      ? [
          '## SKILLS',
          'Load a skill to get detailed instructions for a specific task. No skills are currently available.',
        ].join('\n')
      : [
          '## SKILLS',
          [
            'Load a skill to get detailed instructions for a specific task.',
            'Skills provide specialized knowledge and step-by-step guidance.',
            "Use this when a task matches an available skill's description.",
            `To load a skill, use the \`${platformCoreTools.loadSkill}\` tool with the skill's id.`,
            'Only the skills listed here are available:',
          ].join(' '),
          '<available_skills>',
          ...accessibleSkills.flatMap((skill) => [
            `    <skill id="${skill.id}" path="${skill.basePath}">`,
            `      <name>${skill.name}</name>`,
            `      <description>${skill.description}</description>`,
            `    </skill>`,
          ]),
          '</available_skills>',
        ].join('\n');
  return description;
};
