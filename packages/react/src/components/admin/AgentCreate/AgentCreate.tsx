// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {
  Agent,
  AgentQueryKeys,
  AgentType,
  AgentTypeListResponse,
  CreateAgentRequest,
  SelectOption,
  createAgent,
  getAgentTypes,
  toManagementErrorMessage,
} from '@thunderid/browser';
import {FC, ReactElement, useMemo} from 'react';
import BaseAgentCreate, {AgentCreateSubmission, BaseAgentCreateProps} from './BaseAgentCreate';
import useManagementEndpoint, {ManagementEndpoint} from '../../../hooks/management/useManagementEndpoint';
import useResourceMutation, {ResourceMutationResult} from '../../../hooks/management/useResourceMutation';
import useResourceQuery, {ResourceQueryResult} from '../../../hooks/management/useResourceQuery';
import useTranslation from '../../../hooks/useTranslation';
import useDefaultOuId from '../shared/useDefaultOuId';

export type AgentCreateProps = Omit<BaseAgentCreateProps, 'agentTypes' | 'error' | 'isSubmitting' | 'onSubmit'> & {
  /**
   * Called with the created agent.
   */
  onCreated?: (agent: Agent) => void;
  /**
   * Organization unit the agent is created in. Defaults to the signed-in user's organization unit.
   */
  ouId?: string;
  /**
   * The person responsible for the agent. Defaults to the server's choice, usually the creator.
   */
  owner?: string;
};

/**
 * Registers an agent through the management API.
 *
 * @example
 * ```tsx
 * <AgentCreate onCreated={(agent) => navigate(`/agents/${agent.id}`)} />
 * ```
 */
const AgentCreate: FC<AgentCreateProps> = ({
  onCreated,
  ouId,
  owner,
  preferences,
  ...rest
}: AgentCreateProps): ReactElement => {
  const {t} = useTranslation(preferences?.i18n);
  const resolvedOuId: string | undefined = useDefaultOuId(ouId);
  const agentsEndpoint: ManagementEndpoint = useManagementEndpoint('agents');
  const agentTypesEndpoint: ManagementEndpoint = useManagementEndpoint('agentTypes');
  const {data: agentTypes}: ResourceQueryResult<AgentTypeListResponse> = useResourceQuery(
    [AgentQueryKeys.AGENT_TYPES, {limit: 100}],
    (fetcher) => getAgentTypes({...agentTypesEndpoint, fetcher, limit: 100}),
  );
  const {error, isLoading, mutate}: ResourceMutationResult<Agent, CreateAgentRequest> = useResourceMutation(
    (payload: CreateAgentRequest, fetcher) => createAgent({...agentsEndpoint, fetcher, payload}),
    () => [[AgentQueryKeys.AGENTS]],
    {onSuccess: onCreated},
  );

  const options: SelectOption[] = useMemo(
    () =>
      (agentTypes?.types ?? []).map((agentType: AgentType) => ({
        label: agentType.displayName,
        value: agentType.handle,
      })),
    [agentTypes],
  );

  const handleSubmit = ({description, name, type}: AgentCreateSubmission): void => {
    if (resolvedOuId) {
      void mutate({description, name, ouId: resolvedOuId, owner, type});
    }
  };

  return (
    <BaseAgentCreate
      agentTypes={options}
      onSubmit={handleSubmit}
      isSubmitting={isLoading}
      error={
        resolvedOuId ? toManagementErrorMessage(t, error, 'admin.agents.create.error') : t('admin.common.errors.no_ou')
      }
      preferences={preferences}
      {...rest}
    />
  );
};

export default AgentCreate;
