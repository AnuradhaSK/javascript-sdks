// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import getAgent from './getAgent';
import updateAgent from './updateAgent';
import ThunderIDAPIError from '../../../errors/ThunderIDAPIError';
import {Agent, AgentInboundAuthConfig} from '../../../models/agent-resource';
import {ManagementRequestConfig} from '../../../models/api';
import generateSecret from '../../../utils/generateSecret';
import isDelegatedAgent from '../../../utils/isDelegatedAgent';

export interface RegenerateAgentSecretConfig extends ManagementRequestConfig {
  /**
   * Identifier of the agent.
   */
  agentId: string;
}

export interface RegenerateAgentSecretResult {
  /**
   * The agent after the change.
   */
  agent: Agent;
  /**
   * The new client secret. This is the only time it can be read.
   */
  clientSecret: string;
}

/**
 * Gives an agent's OAuth client a new secret, generated here and saved on the agent. Fails when the
 * agent has no OAuth client.
 */
const regenerateAgentSecret = async ({
  agentId,
  ...config
}: RegenerateAgentSecretConfig): Promise<RegenerateAgentSecretResult> => {
  // The server sets these, and `ouHandle` is only display data, so they do not go back in the update.
  const {clientId, id, ouHandle, ...current}: Agent = await getAgent({...config, agentId});
  void clientId;
  void id;
  void ouHandle;
  const inboundAuthConfig: AgentInboundAuthConfig[] = current.inboundAuthConfig ?? [];

  if (!inboundAuthConfig.some((inbound: AgentInboundAuthConfig) => inbound.type === 'oauth2')) {
    throw new ThunderIDAPIError(
      'The agent has no OAuth client, so it has no client secret to regenerate.',
      'regenerateAgentSecret-ValidationError-001',
      'javascript',
      400,
      'The agent has no OAuth client.',
    );
  }

  const clientSecret: string = generateSecret();
  const updatedInboundAuthConfig: AgentInboundAuthConfig[] = inboundAuthConfig.map((inbound: AgentInboundAuthConfig) =>
    inbound.type === 'oauth2'
      ? {...inbound, config: {...(inbound.config ?? {grantTypes: [], responseTypes: []}), clientSecret}}
      : inbound,
  );
  const agent: Agent = await updateAgent({
    ...config,
    agentId,
    payload: {
      ...current,
      delegated: isDelegatedAgent(updatedInboundAuthConfig),
      inboundAuthConfig: updatedInboundAuthConfig,
    },
  });

  return {agent, clientSecret};
};

export default regenerateAgentSecret;
