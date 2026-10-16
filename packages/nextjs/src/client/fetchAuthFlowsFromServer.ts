// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import type {FetchAuthFlows, SelectPage, SelectPageRequest} from '@thunderid/node';
import loadPageFromAction from './loadPageFromAction';
import getAuthFlowsAction from '../server/actions/getAuthFlowsAction';

/**
 * The loader behind `AuthFlowSelect`: loads authentication flows through {@link getAuthFlowsAction} with the
 * signed-in user's server-held session. Requires an existing session. `request.signal` is not forwarded because
 * an `AbortSignal` cannot cross the server action boundary.
 */
const fetchAuthFlowsFromServer: FetchAuthFlows = async ({limit, offset}: SelectPageRequest): Promise<SelectPage> =>
  loadPageFromAction(await getAuthFlowsAction({limit, offset}), 'getAuthFlowsAction-Error-001');

export default fetchAuthFlowsFromServer;
