// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {mount} from '@vue/test-utils';
import {afterEach, describe, expect, it, vi, type Mock} from 'vitest';
import {h} from 'vue';
import ThemeProvider from '../../providers/ThemeProvider';

describe('ThemeProvider', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('removes the system color scheme listener when unmounted', () => {
    const listeners = new Set<EventListenerOrEventListenerObject>();
    const addEventListener: Mock = vi.fn((_type: string, listener: EventListenerOrEventListenerObject) => {
      listeners.add(listener);
    });
    const removeEventListener: Mock = vi.fn((_type: string, listener: EventListenerOrEventListenerObject) => {
      listeners.delete(listener);
    });

    vi.spyOn(window, 'matchMedia').mockImplementation(
      (query: string): MediaQueryList =>
        ({
          addEventListener,
          addListener: vi.fn(),
          dispatchEvent: vi.fn(),
          matches: false,
          media: query,
          onchange: null,
          removeEventListener,
          removeListener: vi.fn(),
        }) as unknown as MediaQueryList,
    );

    const wrapper = mount(ThemeProvider, {
      props: {mode: 'system'},
      slots: {default: () => h('div')},
    });

    expect(listeners.size).toBe(1);

    wrapper.unmount();

    expect(removeEventListener).toHaveBeenCalledWith('change', addEventListener.mock.calls[0]?.[1]);
    expect(listeners.size).toBe(0);
  });
});
