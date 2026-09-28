// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {AuthFlowSelectConstants, getFlows, SelectConstants, toAuthFlowSelectPage} from '@thunderid/browser';
import type {FetchAuthFlows, SelectPage, SelectPageRequest} from '@thunderid/browser';
import {useCallback} from 'react';
import useManagementEndpoint, {ManagementEndpoint} from './useManagementEndpoint';
import {useResolvedFetcher} from './useResourceQuery';

/**
 * A `FetchAuthFlows` backed by the flow list, restricted to authentication flows and authenticated with
 * the signed-in user's access token. Its identity is stable across renders, since a picker resets its
 * loaded pages when the loader changes.
 */
const useFetchAuthFlows = (): FetchAuthFlows => {
  const {baseUrl, url}: ManagementEndpoint = useManagementEndpoint('flows');
  const fetcher: ReturnType<typeof useResolvedFetcher> = useResolvedFetcher();

  return useCallback(
    async ({limit, offset, signal}: SelectPageRequest): Promise<SelectPage> =>
      toAuthFlowSelectPage(
        await getFlows({
          baseUrl,
          fetcher,
          flowType: AuthFlowSelectConstants.FLOW_TYPE,
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

export default useFetchAuthFlows;
