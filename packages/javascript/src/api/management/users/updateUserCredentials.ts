// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {UpdateUserCredentialsRequest} from '../../../models/managed-user';
import requestManagementResource from '../../../utils/requestManagementResource';

export interface UpdateUserCredentialsConfig extends ManagementRequestConfig {
  /**
   * The new credential values, keyed by attribute name.
   */
  payload: UpdateUserCredentialsRequest;
  /**
   * Identifier of the user.
   */
  userId: string;
}

/**
 * Sets new values for some of a user's credential attributes, such as the password.
 */
const updateUserCredentials = async ({payload, userId, ...config}: UpdateUserCredentialsConfig): Promise<void> => {
  await requestManagementResource<void>(config, {
    body: payload,
    collection: 'users',
    failureMessage: 'Failed to update user credentials',
    id: userId,
    method: 'POST',
    operation: 'updateUserCredentials',
    subPath: 'update-credentials',
  });
};

export default updateUserCredentials;
