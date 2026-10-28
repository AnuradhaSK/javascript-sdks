// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import DelegationGrantTypes from '../constants/DelegationGrantTypes';
import {AgentInboundAuthConfig} from '../models/agent-resource';

/**
 * Whether an agent acts on behalf of a signed-in user, read from the grant types of its OAuth client.
 * The server does not store the flag, so a full agent update has to send it for the agent to stay
 * held to the delegated grant rules.
 */
const isDelegatedAgent = (inboundAuthConfig?: AgentInboundAuthConfig[]): boolean =>
  (
    inboundAuthConfig?.find((inbound: AgentInboundAuthConfig) => inbound.type === 'oauth2')?.config?.grantTypes ?? []
  ).some((grantType: string) => DelegationGrantTypes.includes(grantType));

export default isDelegatedAgent;
