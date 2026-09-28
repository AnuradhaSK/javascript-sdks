// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

'use server';

import {toUserSelectPage} from '@thunderid/node';
import runSelectPageAction, {SelectPageActionResult} from './runSelectPageAction';

/**
 * Request from the browser. Carries no session ID, token, or URL; the session comes from the request cookie.
 */
export interface GetUsersActionRequest {
  filter?: string;
  limit?: number;
  offset?: number;
}

export type GetUsersActionResult = SelectPageActionResult;

/**
 * Loads one page of users for a `USER_SELECT` picker using the signed-in user's server-held session.
 *
 * Never throws across the server action boundary; failures are mapped to a plain result.
 */
const getUsersAction = async ({filter, limit, offset}: GetUsersActionRequest = {}): Promise<GetUsersActionResult> =>
  runSelectPageAction(
    'users',
    {filter, limit, offset},
    async (client, sessionId, query) =>
      toUserSelectPage(
        await client.getUsers({filter: query.filter, limit: query.limit, offset: query.offset}, sessionId),
        query.offset ?? 0,
      ),
    {allowFilter: true},
  );

export default getUsersAction;
