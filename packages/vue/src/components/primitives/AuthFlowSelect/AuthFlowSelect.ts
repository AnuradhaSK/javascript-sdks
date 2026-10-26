// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {type Component, type VNode, defineComponent, h} from 'vue';
import BaseAuthFlowSelect from './BaseAuthFlowSelect';
import useFetchAuthFlows from '../../../composables/auth/useFetchAuthFlows';
import {commonSelectProps, type CommonSelectProps} from '../Select/ResourceSelect';

type AuthFlowSelectProps = CommonSelectProps;

/**
 * Authentication-flow picker for signed-in screens. It loads the authentication flows itself with the
 * signed-in user's access token and submits the chosen flow's ID, so it takes no data source. For any
 * other data source use `Select` with `useInfiniteOptions`.
 */
const AuthFlowSelect: Component = defineComponent({
  name: 'AuthFlowSelect',
  props: {...commonSelectProps},
  emits: ['update:modelValue'],
  setup(props: AuthFlowSelectProps, {emit}): () => VNode {
    const fetchAuthFlows = useFetchAuthFlows();

    return (): VNode =>
      h(BaseAuthFlowSelect, {
        ...props,
        fetchAuthFlows,
        'onUpdate:modelValue': (value: string) => emit('update:modelValue', value),
      });
  },
});

export default AuthFlowSelect;
export type {AuthFlowSelectProps};
