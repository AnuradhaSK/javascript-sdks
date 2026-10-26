// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {getUserTypes, SelectConstants, toUserTypeSelectPage} from '@thunderid/browser';
import type {FetchUserTypes, SelectPage, SelectPageRequest} from '@thunderid/browser';
import {useCallback} from 'react';
import useManagementEndpoint, {ManagementEndpoint} from './useManagementEndpoint';
import {useResolvedFetcher} from './useResourceQuery';

/**
 * A `FetchUserTypes` backed by the user type list, authenticated with the signed-in user's access token.
 * Its identity is stable across renders, since a picker resets its loaded pages when the loader changes.
 */
const useFetchUserTypes = (): FetchUserTypes => {
  const {baseUrl, url}: ManagementEndpoint = useManagementEndpoint('userTypes');
  const fetcher: ReturnType<typeof useResolvedFetcher> = useResolvedFetcher();

  return useCallback(
    async ({limit, offset, signal}: SelectPageRequest): Promise<SelectPage> =>
      toUserTypeSelectPage(
        await getUserTypes({
          baseUrl,
          fetcher,
          limit: Math.min(limit, SelectConstants.MAX_PAGE_SIZE),
          offset,
          signal,
          url,
        }),
        offset,
      ),
    [baseUrl, fetcher, url],
  );
};

export default useFetchUserTypes;
