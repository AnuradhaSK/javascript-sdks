// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {UserUsagesResponse} from '../../../models/managed-user';
import requestManagementResource from '../../../utils/requestManagementResource';

export interface GetUserUsagesConfig extends ManagementRequestConfig {
  /**
   * Identifier of the user.
   */
  userId: string;
}

/**
 * Lists the resources that reference a user, such as agents that name the user as their owner, and
 * what happens to each when the user is deleted.
 */
const getUserUsages = async ({userId, ...config}: GetUserUsagesConfig): Promise<UserUsagesResponse> =>
  requestManagementResource<UserUsagesResponse>(config, {
    collection: 'users',
    failureMessage: 'Failed to fetch user usages',
    id: userId,
    method: 'GET',
    operation: 'getUserUsages',
    subPath: 'usages',
  });

export default getUserUsages;
