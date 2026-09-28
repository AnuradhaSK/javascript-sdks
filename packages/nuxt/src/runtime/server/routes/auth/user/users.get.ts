// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {toUserSelectPage} from '@thunderid/node';
import {defineEventHandler} from 'h3';
import type {H3Event} from 'h3';
import type {ThunderIDGetUsersResult} from '../../../../types';
import {runSelectPageRoute} from '../../../utils/selectPageRoute';

/**
 * GET /api/auth/users
 *
 * Loads one page of users for a `USER_SELECT` picker using the signed-in user's server-held session.
 *
 * Query: optional `limit`, `offset` and `filter`. No session ID, token, or URL is accepted from the browser.
 *
 * Response: `{success: true, page}` or `{success: false, message, statusCode?}`, where `message` is built on the server and never repeats the upstream reply. A failed directory call returns `200` with `success: false`; `401` means an invalid session and `400` a malformed query.
 */
export default defineEventHandler(
  async (event: H3Event): Promise<ThunderIDGetUsersResult> =>
    runSelectPageRoute(
      event,
      'users',
      async (client, sessionId, {filter, limit, offset}) =>
        toUserSelectPage(await client.getUsers({filter, limit, offset}, sessionId), offset ?? 0),
      {allowFilter: true},
    ),
);
