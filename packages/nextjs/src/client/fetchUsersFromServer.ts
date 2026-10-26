// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import type {FetchUsers, SelectPage, SelectPageRequest} from '@thunderid/node';
import loadPageFromAction from './loadPageFromAction';
import getUsersAction from '../server/actions/management/getUsersAction';

/**
 * The loader behind `UserSelect`: loads users through {@link getUsersAction} with the signed-in user's server-held session.
 * Requires an existing session. `request.signal` is not forwarded because an `AbortSignal` cannot cross the server action boundary.
 */
const fetchUsersFromServer: FetchUsers = async ({filter, limit, offset}: SelectPageRequest): Promise<SelectPage> =>
  loadPageFromAction(await getUsersAction({filter, limit, offset}), 'getUsersAction-Error-001');

export default fetchUsersFromServer;
