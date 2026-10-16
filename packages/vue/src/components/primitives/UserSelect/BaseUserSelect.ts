// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {EmbeddedFlowComponentType, UserSelectConstants} from '@thunderid/browser';
import type {FetchUsers, SelectOptionDefaults, UserSelectOptionMapping} from '@thunderid/browser';
import {type Component, type PropType, type VNode, defineComponent, h} from 'vue';
import ResourceSelect, {commonSelectProps, type CommonSelectProps} from '../Select/ResourceSelect';

type BaseUserSelectProps = CommonSelectProps &
  Readonly<{
    fetchUsers?: FetchUsers;
    mapping?: UserSelectOptionMapping;
  }>;

const USER_DEFAULTS: SelectOptionDefaults = {labelAttributes: UserSelectConstants.LABEL_ATTRIBUTES};

/**
 * Single-user picker: a `Select` that loads from the given `fetchUsers` and submits the user's ID.
 * Labels come from `display`, `username`, or `email` unless `mapping` says otherwise.
 * Building block for `UserSelect`; for a custom data source use `Select` with `useInfiniteOptions`.
 */
const BaseUserSelect: Component = defineComponent({
  name: 'BaseUserSelect',
  props: {
    ...commonSelectProps,
    fetchUsers: {default: undefined, type: Function as PropType<FetchUsers>},
    mapping: {default: undefined, type: Object as PropType<UserSelectOptionMapping>},
  },
  emits: ['update:modelValue'],
  setup(props: BaseUserSelectProps, {emit}): () => VNode {
    return (): VNode => {
      const {fetchUsers, mapping, ...common} = props;

      return h(ResourceSelect, {
        ...common,
        bemBlock: 'user-select',
        defaults: USER_DEFAULTS,
        fallbackMessages: {ariaLabel: 'Select a user', empty: 'No users found.'},
        fetchPage: fetchUsers,
        mapping,
        messageKey: 'user_select',
        'onUpdate:modelValue': (value: string) => emit('update:modelValue', value),
        resource: 'users',
        type: EmbeddedFlowComponentType.UserSelect,
      });
    };
  },
});

export default BaseUserSelect;
export type {BaseUserSelectProps};
