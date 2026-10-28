// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

/**
 * Picks the label to show for an agent. An agent's name lives in its attributes as `attributes.name`,
 * so this returns the server's `display` value, then the `name` attribute, then the agent's identifier.
 *
 * @param agent - An agent, or the summary of one from a list response.
 * @returns The label to show.
 *
 * @example
 * ```typescript
 * getAgentName({attributes: {name: 'Nightly Sync Worker'}, id: 'a1'}); // 'Nightly Sync Worker'
 * ```
 */
const getAgentName = (agent: {attributes?: Record<string, unknown>; display?: string; id: string}): string => {
  if (agent.display) {
    return agent.display;
  }

  const name: unknown = agent.attributes?.['name'];

  return typeof name === 'string' && name.length > 0 ? name : agent.id;
};

export default getAgentName;
