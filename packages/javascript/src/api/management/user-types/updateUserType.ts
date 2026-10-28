// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {ManagedUserTypeDetails, UpdateUserTypeRequest} from '../../../models/entity-type';
import requestManagementResource from '../../../utils/requestManagementResource';

export interface UpdateUserTypeConfig extends ManagementRequestConfig {
  /**
   * The user type's new state.
   */
  payload: UpdateUserTypeRequest;
  /**
   * Identifier of the user type.
   */
  userTypeId: string;
}

/**
 * Updates a user type.
 */
const updateUserType = async ({
  payload,
  userTypeId,
  ...config
}: UpdateUserTypeConfig): Promise<ManagedUserTypeDetails> =>
  requestManagementResource<ManagedUserTypeDetails>(config, {
    body: payload,
    collection: 'user-types',
    failureMessage: 'Failed to update user type',
    id: userTypeId,
    method: 'PUT',
    operation: 'updateUserType',
  });

export default updateUserType;
