// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import type {Theme} from '@thunderid/browser';
import {THEME_KEY, ThemeContextValue} from '@thunderid/vue';
import {
  Component,
  computed,
  ComputedRef,
  defineComponent,
  h,
  onErrorCaptured,
  PropType,
  provide,
  Ref,
  ref,
  shallowReadonly,
  VNode,
  watch,
} from 'vue';
import {logEvent} from '../../lib/events';

/**
 * Renders one story. It overrides the SDK theme context with the preview theme, the way
 * ThemeProvider would, without touching the CSS variables ThemeProvider writes to the page root, and
 * keeps a throwing story from taking down the whole explorer.
 */
const StoryHost: Component = defineComponent({
  name: 'StoryHost',
  props: {
    render: {required: true, type: Function as PropType<() => VNode>},
    scheme: {required: true, type: String as PropType<'light' | 'dark'>},
    theme: {required: true, type: Object as PropType<Theme>},
  },
  setup(props: {render: () => VNode; scheme: 'light' | 'dark'; theme: Theme}): () => VNode {
    const error: Ref<string | null> = ref<string | null>(null);
    const scheme: ComputedRef<'light' | 'dark'> = computed(() => props.scheme);
    const theme: ComputedRef<Theme> = computed(() => props.theme);
    const direction: ComputedRef<'ltr' | 'rtl'> = computed((): 'ltr' | 'rtl' => 'ltr');
    const context: ThemeContextValue = {
      colorScheme: scheme,
      direction,
      theme: shallowReadonly(theme),
      toggleTheme: () => undefined,
    };

    provide(THEME_KEY, context);

    watch(
      () => props.render,
      () => {
        error.value = null;
      },
    );

    onErrorCaptured((caught: unknown) => {
      const message: string = caught instanceof Error ? caught.message : String(caught);

      error.value = message;
      logEvent('story:error', message, 'error');

      return false;
    });

    return (): VNode =>
      error.value ? h('div', {class: 'pg-warning', role: 'alert'}, `This story threw: ${error.value}`) : props.render();
  },
});

export default StoryHost;
