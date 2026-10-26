// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

'use client';

import {BaseUserTypeSelect, BaseUserTypeSelectProps} from '@thunderid/react';
import {FC} from 'react';
import fetchUserTypesFromServer from '../../../fetchUserTypesFromServer';

export type UserTypeSelectProps = Omit<BaseUserTypeSelectProps, 'fetchUserTypes'>;

/**
 * User-type picker for signed-in screens. User types load through a server action that uses the
 * signed-in user's server-held session, so the access token never reaches the browser. It takes no
 * data source; for a custom one use `Select` with `useInfiniteOptions`.
 */
const UserTypeSelect: FC<UserTypeSelectProps> = (props: UserTypeSelectProps) => (
  <BaseUserTypeSelect {...props} fetchUserTypes={fetchUserTypesFromServer} />
);

export default UserTypeSelect;
