// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {resolveResourceEndpoint, toUserSelectPage} from '@thunderid/browser';
import type {FetchUsers, SelectPage, SelectPageRequest} from '@thunderid/browser';
import getUsers from '../../api/management/getUsers';
import useThunderID from '../useThunderID';

/** A `FetchUsers` backed by the user directory, authenticated with the signed-in user's access token. */
const useFetchUsers = (): FetchUsers => {
  const {baseUrl, endpoints, instanceId} = useThunderID();
  const usersUrl: string | undefined = resolveResourceEndpoint('users', {endpoints});

  return async ({filter, limit, offset, signal}: SelectPageRequest): Promise<SelectPage> =>
    toUserSelectPage(await getUsers({baseUrl, filter, instanceId, limit, offset, signal, url: usersUrl}), offset);
};

export default useFetchUsers;
