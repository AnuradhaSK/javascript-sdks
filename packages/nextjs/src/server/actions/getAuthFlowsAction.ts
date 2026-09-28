// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

'use server';

import {AuthFlowSelectConstants, capPageSize, toAuthFlowSelectPage} from '@thunderid/node';
import runSelectPageAction, {SelectPageActionResult} from './runSelectPageAction';

/**
 * Request from the browser. Carries only paging; the session comes from the request cookie and the flow
 * type is fixed to authentication on the server.
 */
export interface GetAuthFlowsActionRequest {
  limit?: number;
  offset?: number;
}

export type GetAuthFlowsActionResult = SelectPageActionResult;

/**
 * Loads one page of authentication flows for an `AUTH_FLOW_SELECT` picker using the signed-in user's
 * server-held session.
 *
 * Never throws across the server action boundary; failures are mapped to a plain result.
 */
const getAuthFlowsAction = async ({limit, offset}: GetAuthFlowsActionRequest = {}): Promise<GetAuthFlowsActionResult> =>
  runSelectPageAction('auth flows', {limit, offset}, async (client, sessionId, query) =>
    toAuthFlowSelectPage(
      await client.getFlows(
        {flowType: AuthFlowSelectConstants.FLOW_TYPE, limit: capPageSize(query.limit), offset: query.offset},
        sessionId,
      ),
      query.offset ?? 0,
    ),
  );

export default getAuthFlowsAction;
