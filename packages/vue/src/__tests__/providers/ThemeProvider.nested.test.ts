// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {mount} from '@vue/test-utils';
import {afterEach, describe, expect, it} from 'vitest';
import {defineComponent, h, inject} from 'vue';
import {THEME_KEY} from '../../keys';
import ThemeProvider from '../../providers/ThemeProvider';

const primary = (): string => document.documentElement.style.getPropertyValue('--thunderid-color-primary-main').trim();

const INNER_THEME = {colors: {primary: {main: '#ef4444'}}};

const Outer = defineComponent({
  props: {inner: {default: true, type: Boolean}, main: {required: true, type: String}},
  setup(props) {
    return () =>
      h(
        ThemeProvider,
        {mode: 'light', theme: {colors: {primary: {main: props.main}}}},
        {
          default: () =>
            props.inner ? h(ThemeProvider, {mode: 'light', theme: INNER_THEME}, {default: () => h('div')}) : null,
        },
      );
  },
});

const Scheme = defineComponent({
  setup() {
    const theme = inject(THEME_KEY);
    return () => h('span', theme?.colorScheme.value);
  },
});

describe('ThemeProvider', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('style');
  });

  it('keeps the nested theme on the document root when the outer theme changes', async () => {
    const wrapper = mount(Outer, {props: {main: '#ff7300'}});

    expect(primary()).toBe('#ef4444');

    await wrapper.setProps({main: '#0055ff'});

    expect(primary()).toBe('#ef4444');
    wrapper.unmount();
  });

  it('writes the outer theme again when the nested one unmounts', async () => {
    const wrapper = mount(Outer, {props: {main: '#ff7300'}});

    await wrapper.setProps({inner: false});

    expect(primary()).toBe('#ff7300');
    wrapper.unmount();
  });

  it('follows a change of mode after mount', async () => {
    const wrapper = mount(ThemeProvider, {
      props: {mode: 'light'},
      slots: {default: () => h(Scheme)},
    });

    expect(wrapper.text()).toBe('light');

    await wrapper.setProps({mode: 'dark'});

    expect(wrapper.text()).toBe('dark');
    wrapper.unmount();
  });
});
