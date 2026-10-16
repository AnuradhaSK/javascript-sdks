// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {FC} from 'react';
import BaseUserTypeSelect, {BaseUserTypeSelectProps} from './BaseUserTypeSelect';
import useFetchUserTypes from '../../../hooks/useFetchUserTypes';

export type UserTypeSelectProps = Omit<BaseUserTypeSelectProps, 'fetchUserTypes'>;

/**
 * User-type picker for signed-in screens. It loads the user types itself with the signed-in user's
 * access token and submits the chosen type's handle, so it takes no data source. For any other data
 * source use `Select` with `useInfiniteOptions`.
 */
const UserTypeSelect: FC<UserTypeSelectProps> = (props: UserTypeSelectProps) => (
  <BaseUserTypeSelect {...props} fetchUserTypes={useFetchUserTypes()} />
);

export default UserTypeSelect;
