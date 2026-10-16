// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {EmbeddedFlowComponentType, UserSelectConstants} from '@thunderid/browser';
import type {FetchUsers, SelectOptionDefaults, UserSelectOptionMapping} from '@thunderid/browser';
import {FC} from 'react';
import ResourceSelect, {ResourceSelectProps} from '../Select/ResourceSelect';

export interface BaseUserSelectProps
  extends Omit<
    ResourceSelectProps,
    'bemBlock' | 'defaults' | 'fallbackMessages' | 'fetchPage' | 'mapping' | 'messageKey' | 'resource' | 'type'
  > {
  fetchUsers?: FetchUsers;
  mapping?: UserSelectOptionMapping;
}

const USER_DEFAULTS: SelectOptionDefaults = {labelAttributes: UserSelectConstants.LABEL_ATTRIBUTES};

/**
 * Single-user picker: a `Select` that loads from the given `fetchUsers`, submitting the user's ID and
 * labelling each user from `display`, `username`, or `email` unless `mapping` says otherwise.
 * Building block for {@link UserSelect}; for a custom data source use `Select` with `useInfiniteOptions`.
 */
const BaseUserSelect: FC<BaseUserSelectProps> = ({fetchUsers, mapping, ...rest}: BaseUserSelectProps) => (
  <ResourceSelect
    {...rest}
    bemBlock="user-select"
    defaults={USER_DEFAULTS}
    fallbackMessages={{ariaLabel: 'Select a user', empty: 'No users found.'}}
    fetchPage={fetchUsers}
    mapping={mapping}
    messageKey="user_select"
    resource="users"
    type={EmbeddedFlowComponentType.UserSelect}
  />
);

export default BaseUserSelect;
