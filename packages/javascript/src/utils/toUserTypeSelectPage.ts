// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import toListSelectPage from './toListSelectPage';
import UserTypeSelectConstants from '../constants/UserTypeSelectConstants';
import type {ManagedUserTypeListResponse} from '../models/managed-user-type';
import type {SelectPage} from '../models/select-page';
import type {SelectOption} from '../models/select';

/**
 * Converts a `getUserTypes` response into a loader page: each user type is shown and submitted by
 * its handle.
 */
const toUserTypeSelectPage = (
  response: ManagedUserTypeListResponse,
  requestOffset: number,
): SelectPage & {options: SelectOption[]} =>
  toListSelectPage(response.types, response, requestOffset, UserTypeSelectConstants.MAPPING);

export default toUserTypeSelectPage;
