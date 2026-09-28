// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

'use server';

import {capPageSize, toUserTypeSelectPage} from '@thunderid/node';
import runSelectPageAction, {SelectPageActionResult} from './runSelectPageAction';

/**
 * Request from the browser. Carries only paging; the session comes from the request cookie.
 */
export interface GetUserTypesActionRequest {
  limit?: number;
  offset?: number;
}

export type GetUserTypesActionResult = SelectPageActionResult;

/**
 * Loads one page of user types for a `USER_TYPE_SELECT` picker using the signed-in user's server-held
 * session.
 *
 * Never throws across the server action boundary; failures are mapped to a plain result.
 */
const getUserTypesAction = async ({limit, offset}: GetUserTypesActionRequest = {}): Promise<GetUserTypesActionResult> =>
  runSelectPageAction('user types', {limit, offset}, async (client, sessionId, query) =>
    toUserTypeSelectPage(
      await client.getUserTypes({limit: capPageSize(query.limit), offset: query.offset}, sessionId),
      query.offset ?? 0,
    ),
  );

export default getUserTypesAction;
