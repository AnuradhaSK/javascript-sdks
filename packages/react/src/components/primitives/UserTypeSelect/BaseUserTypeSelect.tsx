// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {EmbeddedFlowComponentType, UserTypeSelectConstants} from '@thunderid/browser';
import type {FetchUserTypes} from '@thunderid/browser';
import {FC} from 'react';
import ResourceSelect, {ResourceSelectProps} from '../Select/ResourceSelect';

export interface BaseUserTypeSelectProps
  extends Omit<
    ResourceSelectProps,
    'bemBlock' | 'defaults' | 'fallbackMessages' | 'fetchPage' | 'mapping' | 'messageKey' | 'resource' | 'type'
  > {
  fetchUserTypes?: FetchUserTypes;
}

/**
 * User-type picker: a `Select` that loads from the given `fetchUserTypes`, showing and submitting
 * each user type's handle. Building block for {@link UserTypeSelect}; for a custom data source use
 * `Select` with `useInfiniteOptions`.
 */
const BaseUserTypeSelect: FC<BaseUserTypeSelectProps> = ({fetchUserTypes, ...rest}: BaseUserTypeSelectProps) => (
  <ResourceSelect
    {...rest}
    bemBlock="user-type-select"
    fallbackMessages={{
      ariaLabel: 'Select a user type',
      empty: 'No user types found.',
    }}
    fetchPage={fetchUserTypes}
    mapping={UserTypeSelectConstants.MAPPING}
    messageKey="user_type_select"
    resource="user types"
    type={EmbeddedFlowComponentType.UserTypeSelect}
  />
);

export default BaseUserTypeSelect;
