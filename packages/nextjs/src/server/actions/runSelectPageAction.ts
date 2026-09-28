// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {loadPageWithRetryAndLog, mapSelectPageError, parseSelectPageQuery} from '@thunderid/node';
import type {SelectPageErrorResult, SelectPage, SelectPageQuery, SelectPageQueryResult} from '@thunderid/node';
import getSessionId from './getSessionId';
import type ThunderIDNextClient from '../../ThunderIDNextClient';
import getClient from '../getClient';

/**
 * What a select page server action returns: the normalized page, or a plain failure. It never
 * throws, because a thrown class instance loses its prototype chain crossing the server action boundary. A failure
 * carries a message built on the server and the status, never the text of the upstream reply.
 */
export type SelectPageActionResult = {page: SelectPage; success: true} | ({success: false} & SelectPageErrorResult);

/**
 * Runs one select page load with the signed-in user's server-held session. The session comes from the
 * request cookie, never from the caller. A server action is a public endpoint, so the paging values the caller
 * sends are checked here and not trusted from their TypeScript types. A missing session, a malformed request or any
 * failure becomes a plain result.
 */
const runSelectPageAction = async (
  resource: string,
  rawQuery: {filter?: unknown; limit?: unknown; offset?: unknown},
  load: (client: ThunderIDNextClient, sessionId: string, query: SelectPageQuery) => Promise<SelectPage>,
  {allowFilter = false}: {allowFilter?: boolean} = {},
): Promise<SelectPageActionResult> => {
  const sessionId: string | undefined = await getSessionId();

  if (!sessionId) {
    return {message: `Failed to load ${resource} (HTTP 401).`, statusCode: 401, success: false};
  }

  const checked: SelectPageQueryResult = parseSelectPageQuery(rawQuery ?? {}, {allowFilter});

  if (checked.invalid !== undefined) {
    return {message: `Failed to load ${resource} (HTTP 400).`, statusCode: 400, success: false};
  }

  const {query} = checked;

  try {
    // The retry and the failure log live here, where the real error and its status still exist. The plain result
    // sent to the browser carries only a message built here and the status.
    const page: SelectPage = await loadPageWithRetryAndLog(resource, {limit: query.limit, offset: query.offset}, () =>
      load(getClient(), sessionId, query),
    );

    return {page, success: true};
  } catch (error) {
    return {...mapSelectPageError(error, resource), success: false};
  }
};

export default runSelectPageAction;
