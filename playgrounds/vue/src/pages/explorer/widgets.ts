// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {Component, defineComponent, h, PropType, Ref, ref, VNode} from 'vue';
import type {Action} from './types';

/**
 * Renders a v-model component with local state, the way an app would bind it with `v-model`, and
 * logs every update to the Actions panel.
 */
export const VModel: Component = defineComponent({
  name: 'VModelStory',
  props: {
    action: {required: true, type: Function as PropType<Action>},
    attrs: {default: () => ({}), type: Object as PropType<Record<string, unknown>>},
    format: {
      default: (value: unknown): string => JSON.stringify(value),
      type: Function as PropType<(value: unknown) => string>,
    },
    initial: {default: '', type: [String, Boolean, Number] as PropType<string | boolean | number>},
    is: {required: true, type: Object as PropType<Component>},
  },
  setup(props: {
    action: Action;
    attrs: Record<string, unknown>;
    format: (value: unknown) => string;
    initial: string | boolean | number;
    is: Component;
  }): () => VNode {
    const value: Ref<unknown> = ref<unknown>(props.initial);

    return (): VNode =>
      h(props.is, {
        ...props.attrs,
        modelValue: value.value,
        'onUpdate:modelValue': (next: unknown): void => {
          value.value = next;
          props.action('update:modelValue', props.format(next));
        },
      });
  },
});

/** Constrains a story to a readable width. */
export const narrow = (width: number, child: VNode): VNode =>
  h('div', {style: {maxWidth: '100%', width: `${width}px`}}, [child]);
