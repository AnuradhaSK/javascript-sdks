// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import type {UserSelectOptionMapping} from '@thunderid/browser';
import {type Component, type PropType, type VNode, defineComponent, h} from 'vue';
import BaseUserSelect from './BaseUserSelect';
import useFetchUsers from '../../../composables/useFetchUsers';
import {commonSelectProps, type CommonSelectProps} from '../Select/ResourceSelect';

type UserSelectProps = CommonSelectProps &
  Readonly<{
    mapping?: UserSelectOptionMapping;
  }>;

/**
 * Single-user picker for signed-in screens. It loads the user directory itself with the signed-in
 * user's access token and submits the chosen user's ID, so it takes no data source. For any other
 * data source use {@link Select} with {@link useInfiniteOptions}.
 */
const UserSelect: Component = defineComponent({
  name: 'UserSelect',
  props: {
    ...commonSelectProps,
    mapping: {default: undefined, type: Object as PropType<UserSelectOptionMapping>},
  },
  emits: ['update:modelValue'],
  setup(props: UserSelectProps, {emit}): () => VNode {
    const fetchUsers = useFetchUsers();

    return (): VNode =>
      h(BaseUserSelect, {
        ...props,
        fetchUsers,
        'onUpdate:modelValue': (value: string) => emit('update:modelValue', value),
      });
  },
});

export default UserSelect;
export type {UserSelectProps};
