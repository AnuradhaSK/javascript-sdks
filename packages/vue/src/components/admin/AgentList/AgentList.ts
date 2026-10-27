// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {AgentQueryKeys, getAgents} from '@thunderid/browser';
import type {AgentListResponse, ApiFilteringParams, BasicAgent} from '@thunderid/browser';
import type {Component} from 'vue';
import BaseAgentList from './BaseAgentList';
import useManagementEndpoint, {type ManagementEndpoint} from '../../../composables/management/useManagementEndpoint';
import useResourceQuery, {type ResourceQueryResult} from '../../../composables/management/useResourceQuery';
import createConnectedAdminList from '../shared/createConnectedAdminList';
import type {AdminTranslate} from '../shared/useAdminTranslation';

/**
 * Lists the agents the signed-in user is allowed to see, a page at a time.
 *
 * Props: `searchable` (default `true`; shows a search form the server matches exactly), `searchAttributes`, `limit`, `selectedAgentId`, `onSelect` (`@select`), `title`, `description`, `className`,
 * `preferences`. Slots: `actions`; `default`, a scoped slot that replaces the table with custom UI and
 * receives `AdminListRenderProps` (rows, default columns, loading and error state, pagination and selection).
 *
 * @example
 * ```vue
 * <AgentList @select="(agent) => (selectedAgentId = agent.id)" />
 * ```
 */
const AgentList: Component = createConnectedAdminList<AgentListResponse, BasicAgent>({
  base: BaseAgentList,
  errorKey: 'admin.agents.list.error',
  name: 'AgentList',
  query: (params: () => Record<string, unknown>): ResourceQueryResult<AgentListResponse> => {
    const endpoint: ManagementEndpoint = useManagementEndpoint('agents');

    return useResourceQuery(
      () => {
        const {filter, limit, offset} = params() as ApiFilteringParams;

        return [AgentQueryKeys.AGENTS, {filter, limit, offset}];
      },
      (fetcher) => {
        const {filter, limit, offset} = params() as ApiFilteringParams;

        return getAgents({...endpoint, fetcher, filter, limit, offset});
      },
    );
  },
  rows: (data: AgentListResponse | undefined) => data?.agents ?? [],
  rowsProp: 'agents',
  searchAttributes: (t: AdminTranslate) => [{label: t('admin.agents.list.search.name'), value: 'name'}],
  selectedProp: 'selectedAgentId',
  total: (data: AgentListResponse | undefined) => data?.totalResults,
});

export default AgentList;
