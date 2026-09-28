// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import type {FetchUsers, SelectPage, SelectPageRequest} from '@thunderid/browser';
import loadPageFromRoute from './loadPageFromRoute';
import NuxtAPIRoutes from '../constants/NuxtAPIRoutes';

/**
 * The loader behind `UserSelect`: loads users through `GET /api/auth/users` with the signed-in user's server-held session.
 * Requires an existing session.
 */
export const fetchUsersFromServer: FetchUsers = async ({
  filter,
  limit,
  offset,
  signal,
}: SelectPageRequest): Promise<SelectPage> =>
  loadPageFromRoute(NuxtAPIRoutes.USERS, {filter, limit, offset}, signal, 'users.get-Error-001');

export default fetchUsersFromServer;
