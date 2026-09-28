// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {loadPageWithRetryAndLog, mapSelectPageError, parseSelectPageQuery} from '@thunderid/node';
import type {SelectPage, SelectPageQuery, SelectPageQueryResult} from '@thunderid/node';
import {createError, getQuery} from 'h3';
import type {H3Event} from 'h3';
import {verifyAndRehydrateSession} from './serverSession';
import type {ThunderIDSelectPageResult} from '../../types';
import ThunderIDNuxtClient from '../ThunderIDNuxtClient';
import {useRuntimeConfig} from '#imports';

/** The paging (and optional filter) values the browser may send to a select page route. */
export type SelectPageRouteQuery = SelectPageQuery;

/**
 * Serves one select page route with the signed-in user's server-held session.
 *
 * Only `limit` and `offset` (and `filter` when `allowFilter` is set) are read from the query; no session ID,
 * token, or URL is accepted from the browser. A failed upstream call returns `200` with `success: false`;
 * `401` means an invalid session and `400` a malformed query.
 */
export const runSelectPageRoute = async (
  event: H3Event,
  resource: string,
  load: (client: ThunderIDNuxtClient, sessionId: string, query: SelectPageRouteQuery) => Promise<SelectPage>,
  {allowFilter = false}: {allowFilter?: boolean} = {},
): Promise<ThunderIDSelectPageResult> => {
  const config: ReturnType<typeof useRuntimeConfig> = useRuntimeConfig();
  const sessionSecret: string | undefined = config.thunderid?.sessionSecret;

  const session: Awaited<ReturnType<typeof verifyAndRehydrateSession>> = await verifyAndRehydrateSession(
    event,
    sessionSecret,
  );
  if (!session) {
    throw createError({statusCode: 401, statusMessage: 'Unauthorized: Invalid or expired session.'});
  }

  const checked: SelectPageQueryResult = parseSelectPageQuery(getQuery(event), {allowFilter});

  if (checked.invalid !== undefined) {
    throw createError({statusCode: 400, statusMessage: `Invalid \`${checked.invalid}\` parameter.`});
  }

  const {query} = checked;

  try {
    // The retry and the failure log live here, where the real error and its status still exist. The plain result
    // sent to the browser carries only a message built here and the status.
    const page: SelectPage = await loadPageWithRetryAndLog(resource, {limit: query.limit, offset: query.offset}, () =>
      load(ThunderIDNuxtClient.getInstance(), session.sessionId, query),
    );

    return {page, success: true};
  } catch (error) {
    return {...mapSelectPageError(error, resource), success: false};
  }
};
