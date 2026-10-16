// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {
  createHttpClientFetcher,
  getUserTypes,
  SelectConstants,
  resolveResourceEndpoint,
  toUserTypeSelectPage,
} from '@thunderid/browser';
import type {FetchUserTypes, SelectPage, SelectPageRequest} from '@thunderid/browser';
import useThunderID from './useThunderID';

/** A `FetchUserTypes` backed by the user type list, authenticated with the signed-in user's access token. */
const useFetchUserTypes = (): FetchUserTypes => {
  const {baseUrl, endpoints, instanceId} = useThunderID();
  const userTypesUrl: string | undefined = resolveResourceEndpoint('userTypes', {endpoints});

  return async ({limit, offset, signal}: SelectPageRequest): Promise<SelectPage> =>
    toUserTypeSelectPage(
      await getUserTypes({
        baseUrl,
        fetcher: createHttpClientFetcher(instanceId),
        limit: Math.min(limit, SelectConstants.MAX_PAGE_SIZE),
        offset,
        signal,
        url: userTypesUrl,
      }),
      offset,
    );
};

export default useFetchUserTypes;
