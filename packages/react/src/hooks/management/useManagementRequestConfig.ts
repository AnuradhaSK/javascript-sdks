// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ApiFetcher, ManagementRequestConfig} from '@thunderid/browser';
import {useMemo} from 'react';
import useManagementEndpoint, {ManagementCollection, ManagementEndpoint} from './useManagementEndpoint';
import {useResolvedFetcher} from './useResourceQuery';

export type {ManagementCollection};

/**
 * Returns the request config the SDK's management API functions take for a collection: the server URL,
 * the collection URL when `endpoints` overrides it, and a fetcher that sends the signed-in user's access
 * token (`ThunderIDProvider`'s `http.fetcher` when set).
 *
 * Use it to call the API functions from an app's own data layer, such as TanStack Query:
 *
 * @example
 * ```tsx
 * const config = useManagementRequestConfig('groups');
 * const groups = useQuery({
 *   queryKey: [GroupQueryKeys.GROUPS, {limit, offset}],
 *   queryFn: () => getGroups({...config, limit, offset}),
 * });
 * ```
 */
const useManagementRequestConfig = (collection: ManagementCollection): ManagementRequestConfig => {
  const {baseUrl, url}: ManagementEndpoint = useManagementEndpoint(collection);
  const fetcher: ApiFetcher = useResolvedFetcher();

  return useMemo(() => ({baseUrl, fetcher, url}), [baseUrl, fetcher, url]);
};

export default useManagementRequestConfig;
