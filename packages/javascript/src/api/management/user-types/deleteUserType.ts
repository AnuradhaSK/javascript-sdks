// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import requestManagementResource from '../../../utils/requestManagementResource';

export interface DeleteUserTypeConfig extends ManagementRequestConfig {
  /**
   * Identifier of the user type to delete.
   */
  userTypeId: string;
}

/**
 * Deletes a user type.
 */
const deleteUserType = async ({userTypeId, ...config}: DeleteUserTypeConfig): Promise<void> => {
  await requestManagementResource<void>(config, {
    collection: 'user-types',
    failureMessage: 'Failed to delete user type',
    id: userTypeId,
    method: 'DELETE',
    operation: 'deleteUserType',
  });
};

export default deleteUserType;
