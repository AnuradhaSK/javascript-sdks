// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {
  AuthFlowSelectConstants,
  createHttpClientFetcher,
  getFlows,
  SelectConstants,
  resolveResourceEndpoint,
  toAuthFlowSelectPage,
} from '@thunderid/browser';
import type {FetchAuthFlows, SelectPage, SelectPageRequest} from '@thunderid/browser';
import useThunderID from './useThunderID';

/**
 * A `FetchAuthFlows` backed by the flow list, restricted to authentication flows and authenticated with
 * the signed-in user's access token.
 */
const useFetchAuthFlows = (): FetchAuthFlows => {
  const {baseUrl, endpoints, instanceId} = useThunderID();
  const flowsUrl: string | undefined = resolveResourceEndpoint('flows', {endpoints});

  return async ({limit, offset, signal}: SelectPageRequest): Promise<SelectPage> =>
    toAuthFlowSelectPage(
      await getFlows({
        baseUrl,
        fetcher: createHttpClientFetcher(instanceId),
        flowType: AuthFlowSelectConstants.FLOW_TYPE,
        limit: Math.min(limit, SelectConstants.MAX_PAGE_SIZE),
        offset,
        signal,
        url: flowsUrl,
      }),
      offset,
    );
};

export default useFetchAuthFlows;
