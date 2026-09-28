// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {capPageSize, toUserTypeSelectPage} from '@thunderid/node';
import {defineEventHandler} from 'h3';
import type {H3Event} from 'h3';
import type {ThunderIDGetUserTypesResult} from '../../../../types';
import {runSelectPageRoute} from '../../../utils/selectPageRoute';

/**
 * GET /api/auth/user-types
 *
 * Loads one page of user types for a `USER_TYPE_SELECT` picker using the signed-in user's server-held session.
 *
 * Query: optional `limit` and `offset`. No session ID, token, or URL is accepted from the browser.
 *
 * Response: `{success: true, page}` or `{success: false, message, statusCode?}`, where `message` is built on the server and never repeats the upstream reply. A failed user type call returns `200` with `success: false`; `401` means an invalid session and `400` a malformed query.
 */
export default defineEventHandler(
  async (event: H3Event): Promise<ThunderIDGetUserTypesResult> =>
    runSelectPageRoute(event, 'user types', async (client, sessionId, {limit, offset}) =>
      toUserTypeSelectPage(await client.getUserTypes({limit: capPageSize(limit), offset}, sessionId), offset ?? 0),
    ),
);
