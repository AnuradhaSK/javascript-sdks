// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {mount} from '@vue/test-utils';
import {describe, expect, it, vi, beforeEach, afterEach} from 'vitest';
import Callback from '../../../components/auth/Callback';

describe('Callback', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    window.history.replaceState({}, '', '/');
    sessionStorage.clear();
  });

  function setWindowLocation(url: string): void {
    const parsed = new URL(url);
    window.history.replaceState({}, '', parsed.pathname + parsed.search);
  }

  it('should render nothing (headless component)', () => {
    setWindowLocation('http://localhost:3000/callback');
    const wrapper = mount(Callback);
    expect(wrapper.html()).toBe('');
    setWindowLocation('http://localhost:3000/callback');
    const onNavigate = vi.fn();
    const onError = vi.fn();

    mount(Callback, {
      props: {onNavigate, onError},
    });

    expect(onNavigate).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });

  it('should forward OAuth code to the return path', () => {
    const state = 'test-state-123';
    setWindowLocation(`http://localhost:3000/callback?code=auth-code-456&state=${state}`);

    // Store the state data in sessionStorage (simulating what signIn does)
    sessionStorage.setItem(`thunderid_oauth_${state}`, JSON.stringify({path: '/dashboard', timestamp: Date.now()}));

    const onNavigate = vi.fn();
    mount(Callback, {
      props: {onNavigate},
    });

    expect(onNavigate).toHaveBeenCalledTimes(1);
    const navigatedPath = onNavigate.mock.calls[0][0];
    expect(navigatedPath).toContain('/dashboard');
    expect(navigatedPath).toContain('code=auth-code-456');
  });

  it('should include nonce in forwarded params when present', () => {
    const state = 'test-state-789';
    setWindowLocation(`http://localhost:3000/callback?code=auth-code&state=${state}&nonce=test-nonce`);

    sessionStorage.setItem(`thunderid_oauth_${state}`, JSON.stringify({path: '/app', timestamp: Date.now()}));

    const onNavigate = vi.fn();
    mount(Callback, {
      props: {onNavigate},
    });

    expect(onNavigate).toHaveBeenCalledTimes(1);
    const navigatedPath = onNavigate.mock.calls[0][0];
    expect(navigatedPath).toContain('nonce=test-nonce');
  });

  it('should call onError when state is missing', () => {
    setWindowLocation('http://localhost:3000/callback?code=auth-code');

    const onError = vi.fn();
    const onNavigate = vi.fn();
    mount(Callback, {
      props: {onError, onNavigate},
    });

    expect(onError).toHaveBeenCalledTimes(1);
    const error = onError.mock.calls[0][0];
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toContain('Missing OAuth state parameter');
  });

  it('should call onError when stored state is not found', () => {
    setWindowLocation('http://localhost:3000/callback?code=auth-code&state=unknown-state');

    const onError = vi.fn();
    const onNavigate = vi.fn();
    mount(Callback, {
      props: {onError, onNavigate},
    });

    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('should call onError when state has expired', () => {
    const state = 'expired-state';
    setWindowLocation(`http://localhost:3000/callback?code=auth-code&state=${state}`);

    // Set timestamp to 11 minutes ago (beyond the 10-minute max)
    sessionStorage.setItem(
      `thunderid_oauth_${state}`,
      JSON.stringify({path: '/dashboard', timestamp: Date.now() - 11 * 60 * 1000}),
    );

    const onError = vi.fn();
    const onNavigate = vi.fn();
    mount(Callback, {
      props: {onError, onNavigate},
    });

    expect(onError).toHaveBeenCalledTimes(1);
    const error = onError.mock.calls[0][0];
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toContain('expired');
  });

  it('should handle OAuth error response and call onError', () => {
    const state = 'error-state';
    setWindowLocation(
      `http://localhost:3000/callback?error=access_denied&error_description=User+cancelled&state=${state}`,
    );

    sessionStorage.setItem(`thunderid_oauth_${state}`, JSON.stringify({path: '/login', timestamp: Date.now()}));

    const onError = vi.fn();
    const onNavigate = vi.fn();
    mount(Callback, {
      props: {onError, onNavigate},
    });

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onNavigate).toHaveBeenCalledTimes(1);
    const navigatedPath = onNavigate.mock.calls[0][0];
    expect(navigatedPath).toContain('error=access_denied');
  });

  it('should clean up sessionStorage after processing', () => {
    const state = 'cleanup-state';
    setWindowLocation(`http://localhost:3000/callback?code=auth-code&state=${state}`);

    sessionStorage.setItem(`thunderid_oauth_${state}`, JSON.stringify({path: '/app', timestamp: Date.now()}));

    const onNavigate = vi.fn();
    mount(Callback, {
      props: {onNavigate},
    });

    expect(sessionStorage.getItem(`thunderid_oauth_${state}`)).toBeNull();
  });
});
