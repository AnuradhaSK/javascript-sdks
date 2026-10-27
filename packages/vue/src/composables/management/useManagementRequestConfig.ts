// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import type {ManagementRequestConfig} from '@thunderid/browser';
import useManagementEndpoint, {type ManagementEndpointKey} from './useManagementEndpoint';
import {resolveManagementFetcher} from './useResourceQuery';
import useThunderID from '../useThunderID';

/**
 * Returns the request config the SDK's management API functions take for a collection: the server URL,
 * the collection URL when `endpoints` overrides it, and a fetcher that sends the signed-in user's access
 * token (`ThunderIDProvider`'s `http.fetcher` when set).
 *
 * Use it to call the API functions from an app's own data layer, such as TanStack Query:
 *
 * @example
 * ```ts
 * const config = useManagementRequestConfig('groups');
 * const groups = useQuery({
 *   queryKey: [GroupQueryKeys.GROUPS, {limit, offset}],
 *   queryFn: () => getGroups({...config, limit, offset}),
 * });
 * ```
 */
const useManagementRequestConfig = (collection: ManagementEndpointKey): ManagementRequestConfig => ({
  ...useManagementEndpoint(collection),
  fetcher: resolveManagementFetcher(useThunderID()),
});

export default useManagementRequestConfig;
