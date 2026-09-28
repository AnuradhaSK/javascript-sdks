// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {type Component, type VNode, defineComponent, h} from 'vue';
import BaseUserTypeSelect from './BaseUserTypeSelect';
import useFetchUserTypes from '../../../composables/useFetchUserTypes';
import {commonSelectProps, type CommonSelectProps} from '../Select/ResourceSelect';

type UserTypeSelectProps = CommonSelectProps;

/**
 * User-type picker for signed-in screens. It loads the user types itself with the signed-in user's
 * access token and submits the chosen type's handle, so it takes no data source. For any other data
 * source use `Select` with `useInfiniteOptions`.
 */
const UserTypeSelect: Component = defineComponent({
  name: 'UserTypeSelect',
  props: {...commonSelectProps},
  emits: ['update:modelValue'],
  setup(props: UserTypeSelectProps, {emit}): () => VNode {
    const fetchUserTypes = useFetchUserTypes();

    return (): VNode =>
      h(BaseUserTypeSelect, {
        ...props,
        fetchUserTypes,
        'onUpdate:modelValue': (value: string) => emit('update:modelValue', value),
      });
  },
});

export default UserTypeSelect;
export type {UserTypeSelectProps};
