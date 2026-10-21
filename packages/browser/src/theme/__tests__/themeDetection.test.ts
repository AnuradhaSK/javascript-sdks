// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {afterEach, describe, expect, it, vi} from 'vitest';
import {createMediaQueryListener} from '../themeDetection';

type ChangeListener = (event: MediaQueryListEvent) => void;

const stubMatchMedia = (): {emit: (matches: boolean) => void} => {
  const listeners: Set<ChangeListener> = new Set<ChangeListener>();

  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      addEventListener: (_type: string, listener: ChangeListener): void => {
        listeners.add(listener);
      },
      matches: false,
      media: query,
      removeEventListener: (_type: string, listener: ChangeListener): void => {
        listeners.delete(listener);
      },
    })),
  );

  return {
    emit: (matches: boolean): void => listeners.forEach((listener) => listener({matches} as MediaQueryListEvent)),
  };
};

describe('createMediaQueryListener', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls the callback when the system theme changes', () => {
    const {emit} = stubMatchMedia();
    const callback = vi.fn();

    createMediaQueryListener(callback);
    emit(true);

    expect(callback).toHaveBeenCalledWith(true);
  });

  it('stops calling the callback after disconnect()', () => {
    const {emit} = stubMatchMedia();
    const callback = vi.fn();

    const listener = createMediaQueryListener(callback);
    listener?.disconnect();
    emit(true);

    expect(callback).not.toHaveBeenCalled();
  });

  it('still returns the MediaQueryList', () => {
    stubMatchMedia();

    expect(createMediaQueryListener(vi.fn())?.media).toBe('(prefers-color-scheme: dark)');
  });
});
