// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {cleanup, render, waitFor} from '@testing-library/react';
import {ThunderIDRuntimeError} from '@thunderid/browser';
import {afterEach, beforeEach, describe, expect, it, vi, Mock} from 'vitest';
import I18nProvider from '../../../../contexts/I18n/I18nProvider';
import ThemeProvider from '../../../../contexts/Theme/ThemeProvider';
import ThunderIDContext, {ThunderIDContextProps} from '../../../../contexts/ThunderID/ThunderIDContext';
import SignIn from '../SignIn';

const mockSignIn = vi.fn() as Mock;

const thunderIDContext: ThunderIDContextProps = {
  applicationId: undefined,
  getStorageManager: vi.fn(() =>
    Promise.resolve({
      getTemporaryData: vi.fn(() => Promise.resolve({})),
      removeHybridDataParameter: vi.fn(),
      removeTemporaryDataParameter: vi.fn(),
      setHybridDataParameter: vi.fn(),
      setTemporaryDataParameter: vi.fn(),
    }),
  ),
  isInitialized: true,
  isLoading: false,
  signIn: mockSignIn,
  vendor: 'thunderid',
} as unknown as ThunderIDContextProps;

describe('SignIn without an application', () => {
  const unhandled: unknown[] = [];
  const onUnhandledRejection = (event: PromiseRejectionEvent): void => {
    unhandled.push(event.reason);
    event.preventDefault();
  };

  beforeEach(() => {
    vi.clearAllMocks();
    unhandled.length = 0;
    sessionStorage.clear();
    window.history.replaceState({}, '', '/signin');
    window.addEventListener('unhandledrejection', onUnhandledRejection);
  });

  afterEach(() => {
    cleanup();
    window.removeEventListener('unhandledrejection', onUnhandledRejection);
  });

  it('reports the missing applicationId through onError only', async () => {
    const onError = vi.fn();

    render(
      <ThunderIDContext.Provider value={thunderIDContext}>
        <I18nProvider>
          <ThemeProvider>
            <SignIn onError={onError} />
          </ThemeProvider>
        </I18nProvider>
      </ThunderIDContext.Provider>,
    );

    await waitFor(() => {
      expect(onError).toHaveBeenCalledTimes(1);
    });
    expect(onError.mock.calls[0][0]).toBeInstanceOf(ThunderIDRuntimeError);
    expect(mockSignIn).not.toHaveBeenCalled();

    // Give a rejected initialization promise time to surface as an unhandled rejection.
    await new Promise((resolve: (value: unknown) => void) => {
      setTimeout(resolve, 50);
    });
    expect(unhandled).toEqual([]);
  });
});
