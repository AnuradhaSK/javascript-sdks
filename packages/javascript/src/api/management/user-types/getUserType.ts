// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {ManagedUserTypeDetails} from '../../../models/entity-type';
import requestManagementResource from '../../../utils/requestManagementResource';

export interface GetUserTypeConfig extends ManagementRequestConfig {
  /**
   * Identifier of the user type.
   */
  userTypeId: string;
}

/**
 * Fetches a user type with its attribute schema.
 */
const getUserType = async ({userTypeId, ...config}: GetUserTypeConfig): Promise<ManagedUserTypeDetails> =>
  requestManagementResource<ManagedUserTypeDetails>(config, {
    collection: 'user-types',
    failureMessage: 'Failed to fetch user type',
    id: userTypeId,
    method: 'GET',
    operation: 'getUserType',
    query: {include: 'display'},
  });

export default getUserType;
