// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {mount} from '@vue/test-utils';
import {describe, expect, it, vi} from 'vitest';
import {h, ref} from 'vue';
import BaseSignInButton from '../../../components/auth/buttons/BaseSignInButton';
import BaseSignOutButton from '../../../components/auth/buttons/BaseSignOutButton';
import SignInButton from '../../../components/auth/buttons/SignInButton';
import SignOutButton from '../../../components/auth/buttons/SignOutButton';
import {THUNDERID_KEY} from '../../../keys';
import type {ThunderIDContext} from '../../../models/contexts';

function createMockThunderIDContext(overrides: Partial<ThunderIDContext> = {}): ThunderIDContext {
  return {
    isSignedIn: ref(false),
    isLoading: ref(false),
    isInitialized: ref(true),
    user: ref(null),
    organization: ref(null),
    signIn: vi.fn().mockResolvedValue(undefined),
    signOut: vi.fn().mockResolvedValue(undefined),
    signUp: vi.fn(),
    signInSilently: vi.fn(),
    getAccessToken: vi.fn(),
    getDecodedIdToken: vi.fn(),
    getIdToken: vi.fn(),
    exchangeToken: vi.fn(),
    reInitialize: vi.fn(),
    clearSession: vi.fn(),
    http: {
      request: vi.fn(),
      requestAll: vi.fn(),
    },
    ...overrides,
  } as unknown as ThunderIDContext;
}

describe('BaseSignInButton', () => {
  it('should render with default "Sign In" text', () => {
    const wrapper = mount(BaseSignInButton, {
      props: {unstyled: true},
    });

    expect(wrapper.text()).toBe('Sign In');
  });

  it('should render custom slot content', () => {
    const wrapper = mount(BaseSignInButton, {
      props: {unstyled: true},
      slots: {
        default: () => h('span', 'Login Now'),
      },
    });

    expect(wrapper.text()).toBe('Login Now');
  });

  it('should emit click event when clicked', async () => {
    const wrapper = mount(BaseSignInButton, {
      props: {unstyled: true},
    });

    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('click')).toHaveLength(1);
  });

  it('should not emit click when disabled', async () => {
    const wrapper = mount(BaseSignInButton, {
      props: {unstyled: true, disabled: true},
    });

    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('click')).toBeUndefined();
  });

  it('should not emit click when loading', async () => {
    const wrapper = mount(BaseSignInButton, {
      props: {unstyled: true, isLoading: true},
    });

    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('click')).toBeUndefined();
  });

  it('should set disabled attribute when disabled prop is true', () => {
    const wrapper = mount(BaseSignInButton, {
      props: {unstyled: true, disabled: true},
    });

    const button = wrapper.find('button');
    expect(button.attributes('disabled')).toBeDefined();
  });

  it('should set disabled attribute when isLoading prop is true', () => {
    const wrapper = mount(BaseSignInButton, {
      props: {unstyled: true, isLoading: true},
    });

    const button = wrapper.find('button');
    expect(button.attributes('disabled')).toBeDefined();
  });
});

describe('BaseSignOutButton', () => {
  it('should render with default "Sign Out" text in unstyled mode', () => {
    const wrapper = mount(BaseSignOutButton, {
      props: {unstyled: true},
    });

    expect(wrapper.text()).toBe('Sign Out');
  });

  it('should emit click event when clicked', async () => {
    const wrapper = mount(BaseSignOutButton, {
      props: {unstyled: true},
    });

    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('click')).toHaveLength(1);
  });

  it('should not emit click when disabled', async () => {
    const wrapper = mount(BaseSignOutButton, {
      props: {unstyled: true, disabled: true},
    });

    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('click')).toBeUndefined();
  });
});

describe('SignInButton', () => {
  it('should call signIn when clicked', async () => {
    const signIn = vi.fn().mockResolvedValue(undefined);
    const mockContext = createMockThunderIDContext({signIn});

    const wrapper = mount(SignInButton, {
      global: {
        provide: {
          [THUNDERID_KEY as symbol]: mockContext,
        },
      },
    });

    await wrapper.find('button').trigger('click');
    // Allow the async handler to complete
    await vi.waitFor(() => {
      expect(signIn).toHaveBeenCalled();
    });
  });

  it('should emit error event when signIn fails', async () => {
    const signIn = vi.fn().mockRejectedValue(new Error('Auth failed'));
    const mockContext = createMockThunderIDContext({signIn});

    const wrapper = mount(SignInButton, {
      global: {
        provide: {
          [THUNDERID_KEY as symbol]: mockContext,
        },
        config: {
          errorHandler: () => {
            // Suppress unhandled ThunderIDRuntimeError thrown after emit
          },
        },
      },
    });

    await wrapper.find('button').trigger('click');
    await vi.waitFor(() => {
      expect(wrapper.emitted('error')).toBeDefined();
    });
  });

  it('should pass signInOptions prop to signIn', async () => {
    const signIn = vi.fn().mockResolvedValue(undefined);
    const mockContext = createMockThunderIDContext({signIn});
    const options = {prompt: 'login'};

    const wrapper = mount(SignInButton, {
      global: {
        provide: {
          [THUNDERID_KEY as symbol]: mockContext,
        },
      },
      props: {
        signInOptions: options,
      },
    });

    await wrapper.find('button').trigger('click');
    await vi.waitFor(() => {
      expect(signIn).toHaveBeenCalledWith(options);
    });
  });

  it('should render plain text slot content inside the styled, click-wired button', async () => {
    const signIn = vi.fn().mockResolvedValue(undefined);
    const mockContext = createMockThunderIDContext({signIn});

    const wrapper = mount(SignInButton, {
      global: {
        provide: {
          [THUNDERID_KEY as symbol]: mockContext,
        },
      },
      slots: {
        default: 'Sign In',
      },
    });

    const button = wrapper.find('button');
    expect(button.exists()).toBe(true);
    expect(button.text()).toBe('Sign In');

    await button.trigger('click');
    await vi.waitFor(() => {
      expect(signIn).toHaveBeenCalled();
    });
  });

  it('should bypass the styled button when asChild is set', async () => {
    const signIn = vi.fn().mockResolvedValue(undefined);
    const mockContext = createMockThunderIDContext({signIn});

    const wrapper = mount(SignInButton, {
      global: {
        provide: {
          [THUNDERID_KEY as symbol]: mockContext,
        },
      },
      props: {
        asChild: true,
      },
      slots: {
        default: ({signIn: doSignIn, isLoading}: {signIn: () => void; isLoading: boolean}) =>
          h('a', {href: '#', onClick: doSignIn}, isLoading ? 'Signing in…' : 'Sign in'),
      },
    });

    const link = wrapper.find('a');
    expect(link.exists()).toBe(true);
    expect(wrapper.find('button').exists()).toBe(false);

    await link.trigger('click');
    await vi.waitFor(() => {
      expect(signIn).toHaveBeenCalled();
    });
  });
});

describe('SignOutButton', () => {
  it('should call signOut when clicked', async () => {
    const signOut = vi.fn().mockResolvedValue(undefined);
    const mockContext = createMockThunderIDContext({signOut});

    const wrapper = mount(SignOutButton, {
      global: {
        provide: {
          [THUNDERID_KEY as symbol]: mockContext,
        },
      },
    });

    await wrapper.find('button').trigger('click');
    await vi.waitFor(() => {
      expect(signOut).toHaveBeenCalled();
    });
  });

  it('should emit error event when signOut fails', async () => {
    const signOut = vi.fn().mockRejectedValue(new Error('Sign out failed'));
    const mockContext = createMockThunderIDContext({signOut});

    const wrapper = mount(SignOutButton, {
      global: {
        provide: {
          [THUNDERID_KEY as symbol]: mockContext,
        },
        config: {
          errorHandler: () => {
            // Suppress unhandled ThunderIDRuntimeError thrown after emit
          },
        },
      },
    });

    await wrapper.find('button').trigger('click');
    await vi.waitFor(() => {
      expect(wrapper.emitted('error')).toBeDefined();
    });
  });
});
