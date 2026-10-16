// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {AuthFlowSelectConstants, EmbeddedFlowComponentType} from '@thunderid/browser';
import type {FetchAuthFlows, SelectOptionDefaults} from '@thunderid/browser';
import {type Component, type PropType, type VNode, defineComponent, h} from 'vue';
import ResourceSelect, {commonSelectProps, type CommonSelectProps} from '../Select/ResourceSelect';

type BaseAuthFlowSelectProps = CommonSelectProps & Readonly<{fetchAuthFlows?: FetchAuthFlows}>;

const AUTH_FLOW_DEFAULTS: SelectOptionDefaults = {labelAttributes: AuthFlowSelectConstants.LABEL_ATTRIBUTES};

/**
 * Authentication-flow picker: a `Select` that loads from the given `fetchAuthFlows`, showing each flow by
 * its name and submitting its ID. Building block for `AuthFlowSelect`; for a custom data source use
 * `Select` with `useInfiniteOptions`.
 */
const BaseAuthFlowSelect: Component = defineComponent({
  name: 'BaseAuthFlowSelect',
  props: {
    ...commonSelectProps,
    fetchAuthFlows: {default: undefined, type: Function as PropType<FetchAuthFlows>},
  },
  emits: ['update:modelValue'],
  setup(props: BaseAuthFlowSelectProps, {emit}): () => VNode {
    return (): VNode => {
      const {fetchAuthFlows, ...common} = props;

      return h(ResourceSelect, {
        ...common,
        bemBlock: 'auth-flow-select',
        defaults: AUTH_FLOW_DEFAULTS,
        fallbackMessages: {
          ariaLabel: 'Select a login flow',
          empty: 'No login flows found.',
        },
        fetchPage: fetchAuthFlows,
        messageKey: 'auth_flow_select',
        'onUpdate:modelValue': (value: string) => emit('update:modelValue', value),
        resource: 'auth flows',
        type: EmbeddedFlowComponentType.AuthFlowSelect,
      });
    };
  },
});

export default BaseAuthFlowSelect;
export type {BaseAuthFlowSelectProps};
