// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import type {FetchUserTypes, SelectPage, SelectPageRequest} from '@thunderid/node';
import loadPageFromAction from './loadPageFromAction';
import getUserTypesAction from '../server/actions/getUserTypesAction';

/**
 * The loader behind `UserTypeSelect`: loads user types through {@link getUserTypesAction} with the signed-in
 * user's server-held session. Requires an existing session. `request.signal` is not forwarded because an
 * `AbortSignal` cannot cross the server action boundary.
 */
const fetchUserTypesFromServer: FetchUserTypes = async ({limit, offset}: SelectPageRequest): Promise<SelectPage> =>
  loadPageFromAction(await getUserTypesAction({limit, offset}), 'getUserTypesAction-Error-001');

export default fetchUserTypesFromServer;
