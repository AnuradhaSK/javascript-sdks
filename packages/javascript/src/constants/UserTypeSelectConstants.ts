// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import type {SelectOptionMapping} from '../models/select';

/**
 * Rules for turning user types into USER_TYPE_SELECT options.
 */
const UserTypeSelectConstants: {
  MAPPING: SelectOptionMapping;
} = {
  /**
   * A user type is shown and submitted by its handle. Display names are not unique, so they are not
   * used.
   */
  MAPPING: {labelAttributes: ['handle'], valueAttribute: 'handle'},
};

export default UserTypeSelectConstants;
