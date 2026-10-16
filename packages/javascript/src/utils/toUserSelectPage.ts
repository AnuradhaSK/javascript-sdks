// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import toListSelectPage from './toListSelectPage';
import UserSelectConstants from '../constants/UserSelectConstants';
import type {ManagedUserListResponse} from '../models/managed-user';
import type {SelectPage} from '../models/select-page';
import type {SelectOption} from '../models/select';
import type {UserSelectOptionMapping} from '../models/user-select';

/**
 * Converts a `getUsers` response into a loader page. The next offset comes from the backend's own
 * `count`, so users dropped by the mapping never shift the paging.
 */
const toUserSelectPage = (
  response: ManagedUserListResponse,
  requestOffset: number,
  mapping?: UserSelectOptionMapping,
): SelectPage & {options: SelectOption[]} =>
  toListSelectPage(response.users, response, requestOffset, mapping, {
    labelAttributes: UserSelectConstants.LABEL_ATTRIBUTES,
  });

export default toUserSelectPage;
