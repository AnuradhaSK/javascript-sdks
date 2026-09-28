// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {AuthFlowSelectConstants, capPageSize, toAuthFlowSelectPage} from '@thunderid/node';
import {defineEventHandler} from 'h3';
import type {H3Event} from 'h3';
import type {ThunderIDGetAuthFlowsResult} from '../../../../types';
import {runSelectPageRoute} from '../../../utils/selectPageRoute';

/**
 * GET /api/auth/auth-flows
 *
 * Loads one page of authentication flows for an `AUTH_FLOW_SELECT` picker using the signed-in user's
 * server-held session. The flow type is fixed to authentication on the server.
 *
 * Query: optional `limit` and `offset`. No session ID, token, URL, or flow type is accepted from the browser.
 *
 * Response: `{success: true, page}` or `{success: false, message, statusCode?}`, where `message` is built on the server and never repeats the upstream reply. A failed flow call returns `200` with `success: false`; `401` means an invalid session and `400` a malformed query.
 */
export default defineEventHandler(
  async (event: H3Event): Promise<ThunderIDGetAuthFlowsResult> =>
    runSelectPageRoute(event, 'auth flows', async (client, sessionId, {limit, offset}) =>
      toAuthFlowSelectPage(
        await client.getFlows(
          {flowType: AuthFlowSelectConstants.FLOW_TYPE, limit: capPageSize(limit), offset},
          sessionId,
        ),
        offset ?? 0,
      ),
    ),
);
