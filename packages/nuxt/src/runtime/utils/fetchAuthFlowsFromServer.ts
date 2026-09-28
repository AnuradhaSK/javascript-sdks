// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import type {FetchAuthFlows, SelectPage, SelectPageRequest} from '@thunderid/browser';
import loadPageFromRoute from './loadPageFromRoute';
import NuxtAPIRoutes from '../constants/NuxtAPIRoutes';

/**
 * The loader behind `AuthFlowSelect`: loads authentication flows through `GET /api/auth/auth-flows` with the
 * signed-in user's server-held session. Requires an existing session.
 */
export const fetchAuthFlowsFromServer: FetchAuthFlows = async ({
  limit,
  offset,
  signal,
}: SelectPageRequest): Promise<SelectPage> =>
  loadPageFromRoute(NuxtAPIRoutes.AUTH_FLOWS, {limit, offset}, signal, 'auth-flows.get-Error-001');

export default fetchAuthFlowsFromServer;
