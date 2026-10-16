// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import type {FetchUserTypes, SelectPage, SelectPageRequest} from '@thunderid/browser';
import loadPageFromRoute from './loadPageFromRoute';
import NuxtAPIRoutes from '../constants/NuxtAPIRoutes';

/**
 * The loader behind `UserTypeSelect`: loads user types through `GET /api/auth/user-types` with the signed-in
 * user's server-held session. Requires an existing session.
 */
export const fetchUserTypesFromServer: FetchUserTypes = async ({
  limit,
  offset,
  signal,
}: SelectPageRequest): Promise<SelectPage> =>
  loadPageFromRoute(NuxtAPIRoutes.USER_TYPES, {limit, offset}, signal, 'user-types.get-Error-001');

export default fetchUserTypesFromServer;
