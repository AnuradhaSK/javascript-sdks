// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {EmbeddedFlowComponentType, UserTypeSelectConstants} from '@thunderid/browser';
import type {FetchUserTypes} from '@thunderid/browser';
import {type Component, type PropType, type VNode, defineComponent, h} from 'vue';
import ResourceSelect, {commonSelectProps, type CommonSelectProps} from '../Select/ResourceSelect';

type BaseUserTypeSelectProps = CommonSelectProps & Readonly<{fetchUserTypes?: FetchUserTypes}>;

/**
 * User-type picker: a `Select` that loads from the given `fetchUserTypes`, showing and submitting each
 * user type's handle. Building block for `UserTypeSelect`; for a custom data source use `Select` with
 * `useInfiniteOptions`.
 */
const BaseUserTypeSelect: Component = defineComponent({
  name: 'BaseUserTypeSelect',
  props: {
    ...commonSelectProps,
    fetchUserTypes: {default: undefined, type: Function as PropType<FetchUserTypes>},
  },
  emits: ['update:modelValue'],
  setup(props: BaseUserTypeSelectProps, {emit}): () => VNode {
    return (): VNode => {
      const {fetchUserTypes, ...common} = props;

      return h(ResourceSelect, {
        ...common,
        bemBlock: 'user-type-select',
        fallbackMessages: {
          ariaLabel: 'Select a user type',
          empty: 'No user types found.',
        },
        fetchPage: fetchUserTypes,
        mapping: UserTypeSelectConstants.MAPPING,
        messageKey: 'user_type_select',
        'onUpdate:modelValue': (value: string) => emit('update:modelValue', value),
        resource: 'user types',
        type: EmbeddedFlowComponentType.UserTypeSelect,
      });
    };
  },
});

export default BaseUserTypeSelect;
export type {BaseUserTypeSelectProps};
