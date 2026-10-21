// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {cleanup, render} from '@testing-library/react';
import {afterEach, describe, expect, it, vi} from 'vitest';
import ThemeProvider from '../ThemeProvider';

describe('ThemeProvider system mode', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('removes the system theme listener it registered when it unmounts', () => {
    const listeners: Set<EventListenerOrEventListenerObject> = new Set();
    const mediaQuery: MediaQueryList = {
      addEventListener: (_type: string, listener: EventListenerOrEventListenerObject) => listeners.add(listener),
      addListener: vi.fn(),
      dispatchEvent: vi.fn(),
      matches: false,
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      removeEventListener: (_type: string, listener: EventListenerOrEventListenerObject) => listeners.delete(listener),
      removeListener: vi.fn(),
    } as unknown as MediaQueryList;
    vi.spyOn(window, 'matchMedia').mockReturnValue(mediaQuery);

    const {unmount} = render(
      <ThemeProvider mode="system">
        <div />
      </ThemeProvider>,
    );

    expect(listeners.size).toBe(1);

    unmount();

    expect(listeners.size).toBe(0);
  });
});
