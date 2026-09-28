// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {EmbeddedFlowComponentType, getDefaultI18nBundles, substituteTranslationParams} from '@thunderid/browser';
import type {EmbeddedFlowComponent} from '@thunderid/browser';
import {mount} from '@vue/test-utils';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {ref, type Component} from 'vue';
import BaseSignIn from '../../components/auth/sign-in/BaseSignIn';
import BaseAcceptInvite from '../../components/presentation/accept-invite/BaseAcceptInvite';
import BaseInviteUser from '../../components/presentation/invite-user/BaseInviteUser';
import CopyableText from '../../components/primitives/CopyableText';
import {FLOW_KEY, FLOW_META_KEY, I18N_KEY} from '../../keys';

const SECRET = 'sup3r-s3cret-value';

const i18n = {
  bundles: ref({}),
  currentLanguage: ref('en-US'),
  fallbackLanguage: 'en-US',
  injectBundles: vi.fn(),
  setLanguage: vi.fn(),
  t: (key: string, params?: Record<string, string | number>): string => {
    const translations = getDefaultI18nBundles()['en-US']?.translations as Record<string, string>;
    const value: string = translations?.[key] ?? key;

    return params ? substituteTranslationParams(value, params) : value;
  },
};

const provide = {
  [FLOW_KEY as symbol]: {
    addMessage: vi.fn(),
    clearMessages: vi.fn(),
    messages: ref([]),
    subtitle: ref(''),
    title: ref(''),
  },
  [FLOW_META_KEY as symbol]: {meta: ref(null)},
  [I18N_KEY as symbol]: i18n,
};

const mounted: {unmount: () => void}[] = [];
const mountWith = (component: Component, props: Record<string, unknown>) => {
  const wrapper = mount(component, {attachTo: document.body, global: {provide}, props});
  mounted.push(wrapper);

  return wrapper;
};

describe('CopyableText (vue)', () => {
  const writeText = vi.fn().mockResolvedValue(undefined);

  afterEach(() => {
    mounted.splice(0).forEach((wrapper) => wrapper.unmount());
    writeText.mockClear();
    vi.useRealTimers();
  });

  const mountCopyable = (props: Record<string, unknown> = {}) => {
    Object.defineProperty(navigator, 'clipboard', {configurable: true, value: {writeText}});

    return mountWith(CopyableText, {value: SECRET, ...props});
  };

  it('shows the label and the value, and no Show button', () => {
    const wrapper = mountCopyable({label: 'Client ID'});

    expect(wrapper.find('.thunderid-copyable-text__label').text()).toBe('Client ID');
    expect(wrapper.find('.thunderid-copyable-text__value').text()).toBe(SECRET);
    expect(wrapper.findAll('button').map((b) => b.attributes('aria-label'))).toEqual(['Copy']);
  });

  it('copies the value and shows Copied! for 3 seconds', async () => {
    vi.useFakeTimers();
    const wrapper = mountCopyable();

    await wrapper.find('button').trigger('click');
    await vi.advanceTimersByTimeAsync(0);
    expect(writeText).toHaveBeenCalledWith(SECRET);
    expect(wrapper.find('button').attributes('aria-label')).toBe('Copied!');

    await vi.advanceTimersByTimeAsync(3000);
    expect(wrapper.find('button').attributes('aria-label')).toBe('Copy');
  });

  describe('copy control', () => {
    const copyOf = (wrapper: ReturnType<typeof mountCopyable>) => wrapper.find('button[aria-label="Copy"]');

    it('is an icon button with no visible text, named Copy', () => {
      const wrapper = mountCopyable();

      expect(copyOf(wrapper).text()).toBe('');
      expect(copyOf(wrapper).find('svg').exists()).toBe(true);
    });

    it('sits inside the box that holds the value', () => {
      const wrapper = mountCopyable();

      expect(wrapper.find('.thunderid-copyable-text__box').find('button[aria-label="Copy"]').exists()).toBe(true);
      expect(wrapper.find('.thunderid-copyable-text__box').find('.thunderid-copyable-text__value').exists()).toBe(true);
    });

    it('sits inside the password field when the value is masked', () => {
      const wrapper = mountCopyable({masked: true});

      expect(wrapper.find('.thunderid-password-field__wrapper').find('button[aria-label="Copy"]').exists()).toBe(true);
    });

    it('uses the same icon whether or not the value is masked', () => {
      const plain = mountCopyable();
      const masked = mountCopyable({masked: true});

      expect(copyOf(masked).find('svg').html()).toBe(copyOf(plain).find('svg').html());
    });

    it('swaps to a check mark after copying, and is named Copied!', async () => {
      const wrapper = mountCopyable();
      const copyIcon = copyOf(wrapper).find('svg').html();

      await copyOf(wrapper).trigger('click');

      await vi.waitFor(() => expect(wrapper.find('button[aria-label="Copied!"]').exists()).toBe(true));
      expect(wrapper.find('button[aria-label="Copied!"]').find('svg').html()).not.toBe(copyIcon);
    });
  });

  describe('with masking', () => {
    const FIELD = 'input';
    const toggleOf = (wrapper: ReturnType<typeof mountCopyable>) => wrapper.find('.thunderid-password-field__toggle');
    const fieldOf = (wrapper: ReturnType<typeof mountCopyable>) => wrapper.find(FIELD);

    it('shows the value in a read-only password field', () => {
      const wrapper = mountCopyable({label: 'Client secret', masked: true});

      expect(fieldOf(wrapper).attributes('type')).toBe('password');
      expect(fieldOf(wrapper).attributes('readonly')).toBeDefined();
      expect((fieldOf(wrapper).element as HTMLInputElement).value).toBe(SECRET);
      expect(fieldOf(wrapper).attributes('autocomplete')).toBe('off');
      expect(fieldOf(wrapper).attributes('aria-label')).toBe('Client secret');
    });

    it('does not put the value on the page as text', () => {
      const wrapper = mountCopyable({masked: true});

      expect(wrapper.text()).not.toContain(SECRET);
    });

    it('shows the value on Show and hides it again on Hide', async () => {
      const wrapper = mountCopyable({masked: true});

      await toggleOf(wrapper).trigger('click');
      expect(fieldOf(wrapper).attributes('type')).toBe('text');
      expect(toggleOf(wrapper).attributes('aria-label')).toBe('Hide');

      await toggleOf(wrapper).trigger('click');
      expect(fieldOf(wrapper).attributes('type')).toBe('password');
      expect(toggleOf(wrapper).attributes('aria-label')).toBe('Show');
    });

    it('names the toggle after what it does next and does not also mark it pressed', async () => {
      const wrapper = mountCopyable({masked: true});

      expect(toggleOf(wrapper).attributes('aria-label')).toBe('Show');
      expect(toggleOf(wrapper).attributes('aria-pressed')).toBeUndefined();

      await toggleOf(wrapper).trigger('click');

      expect(toggleOf(wrapper).attributes('aria-pressed')).toBeUndefined();
    });

    it('toggles with an eye icon, not a text button', async () => {
      const wrapper = mountCopyable({masked: true});
      const eyeShape = toggleOf(wrapper).find('svg').html();

      expect(toggleOf(wrapper).text()).toBe('');
      expect(toggleOf(wrapper).find('svg').exists()).toBe(true);

      await toggleOf(wrapper).trigger('click');
      expect(toggleOf(wrapper).text()).toBe('');
      expect(toggleOf(wrapper).find('svg').html()).not.toBe(eyeShape);
    });

    it('can be reached with the Tab key', () => {
      const wrapper = mountCopyable({masked: true});

      expect(toggleOf(wrapper).attributes('tabindex')).toBe('0');
    });

    it('copies the real value while it is hidden', async () => {
      const wrapper = mountCopyable({masked: true});

      await wrapper.find('button[aria-label="Copy"]').trigger('click');

      await vi.waitFor(() => expect(writeText).toHaveBeenCalledWith(SECRET));
      expect(fieldOf(wrapper).attributes('type')).toBe('password');
    });

    it('starts hidden again for a new component', async () => {
      const first = mountCopyable({masked: true});
      await toggleOf(first).trigger('click');
      first.unmount();

      const second = mountCopyable({masked: true});

      expect(fieldOf(second).attributes('type')).toBe('password');
    });
  });
});

const copyableComponent = (overrides: Record<string, unknown> = {}): EmbeddedFlowComponent =>
  ({
    id: 'secret_display',
    label: 'Client secret',
    source: 'clientSecret',
    type: EmbeddedFlowComponentType.CopyableText,
    ...overrides,
  }) as EmbeddedFlowComponent;

const ADDITIONAL_DATA = {clientSecret: SECRET};

const FLOWS: Record<string, (component: EmbeddedFlowComponent) => ReturnType<typeof mountWith>> = {
  BaseAcceptInvite: (component) =>
    mountWith(BaseAcceptInvite, {
      flowId: 'exec-1',
      inviteToken: 'token-1',
      onSubmit: vi.fn().mockResolvedValue({
        data: {additionalData: ADDITIONAL_DATA, components: [component]},
        executionId: 'exec-1',
        flowStatus: 'INCOMPLETE',
      }),
    }),
  BaseInviteUser: (component) =>
    mountWith(BaseInviteUser, {
      isInitialized: true,
      onInitialize: vi.fn().mockResolvedValue({
        data: {additionalData: ADDITIONAL_DATA, components: [component]},
        executionId: 'exec-1',
        flowStatus: 'INCOMPLETE',
      }),
      onSubmit: vi.fn(),
    }),
  BaseSignIn: (component) =>
    mountWith(BaseSignIn, {additionalData: ADDITIONAL_DATA, components: [component], onSubmit: vi.fn()}),
};

describe.each(Object.keys(FLOWS))('%s with a COPYABLE_TEXT component (vue)', (flowName: string) => {
  afterEach(() => {
    mounted.splice(0).forEach((wrapper) => wrapper.unmount());
  });

  it('shows the value the flow sent under the component source key', async () => {
    const wrapper = FLOWS[flowName](copyableComponent());

    await vi.waitFor(() => expect(wrapper.find('.thunderid-copyable-text').exists()).toBe(true));
    expect(wrapper.find('.thunderid-copyable-text__label').text()).toBe('Client secret');
    expect(wrapper.find('.thunderid-copyable-text__value').text()).toBe(SECRET);
  });

  it('hides the value in a password field when the flow marks it masked', async () => {
    const wrapper = FLOWS[flowName](copyableComponent({masked: true}));

    await vi.waitFor(() => expect(wrapper.find('.thunderid-copyable-text').exists()).toBe(true));
    expect(wrapper.find('.thunderid-copyable-text input').attributes('type')).toBe('password');
    expect(wrapper.find('.thunderid-copyable-text__value').exists()).toBe(false);
    expect(wrapper.text()).not.toContain(SECRET);
  });
});
