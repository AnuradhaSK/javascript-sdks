// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {
  getDefaultI18nBundles,
  getFlows,
  getUserTypes,
  SelectConstants,
  substituteTranslationParams,
} from '@thunderid/browser';
import {mount} from '@vue/test-utils';
import {afterEach, describe, expect, it, vi} from 'vitest';
import type {Component} from 'vue';
import {ref} from 'vue';
import AuthFlowSelect from '../../../components/primitives/AuthFlowSelect/AuthFlowSelect';
import BaseAuthFlowSelect from '../../../components/primitives/AuthFlowSelect/BaseAuthFlowSelect';
import BaseUserTypeSelect from '../../../components/primitives/UserTypeSelect/BaseUserTypeSelect';
import UserTypeSelect from '../../../components/primitives/UserTypeSelect/UserTypeSelect';
import {I18N_KEY} from '../../../keys';
import type {I18nContextValue} from '../../../models/contexts';
import {chooseOption, findSelectControl} from '../../helpers/selectControl';

vi.mock('@thunderid/browser', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@thunderid/browser')>()),
  getFlows: vi.fn(),
  getUserTypes: vi.fn(),
}));
vi.mock('../../../composables/useThunderID', () => ({
  default: () => ({
    baseUrl: 'https://thunder.example',
    endpoints: {flows: 'https://rs.example.com/flows', userTypes: 'https://rs.example.com/user-types'},
  }),
}));

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
} as unknown as I18nContextValue;

const mounted: {unmount: () => void}[] = [];
const mountPicker = (picker: Component, props: Record<string, unknown> = {}) => {
  const wrapper = mount(picker, {
    attachTo: document.body,
    global: {provide: {[I18N_KEY as symbol]: i18n}},
    props: {label: 'Picker', ...props},
  });
  mounted.push(wrapper);
  return wrapper;
};

const waitForOptions = (wrapper: ReturnType<typeof mountPicker>, expectedOptions: number): Promise<void> =>
  vi.waitFor(() =>
    expect(
      Array.from((findSelectControl(wrapper).element as HTMLSelectElement).options).filter(
        (option) => option.value !== SelectConstants.LOAD_MORE_OPTION_VALUE,
      ),
    ).toHaveLength(expectedOptions),
  );

describe('AUTH_FLOW_SELECT pickers (vue)', () => {
  afterEach(() => {
    mounted.splice(0).forEach((wrapper) => wrapper.unmount());
    vi.clearAllMocks();
  });

  it('BaseAuthFlowSelect requests the first page when it renders, shows names and emits the flow ID', async () => {
    const fetchAuthFlows = vi.fn().mockResolvedValue({
      nextOffset: null,
      options: [
        {label: 'Password login', value: 'flow-1'},
        {label: 'Passkey login', value: 'flow-2'},
      ],
    });
    const wrapper = mountPicker(BaseAuthFlowSelect, {fetchAuthFlows});

    await waitForOptions(wrapper, 2);
    await chooseOption(findSelectControl(wrapper), 'Passkey login');

    expect(fetchAuthFlows).toHaveBeenCalledWith(expect.objectContaining({limit: 30, offset: 0}));
    expect(wrapper.emitted('update:modelValue')).toEqual([['flow-2']]);
  });

  it('BaseAuthFlowSelect shows the translated empty message', async () => {
    const wrapper = mountPicker(BaseAuthFlowSelect, {
      fetchAuthFlows: vi.fn().mockResolvedValue({nextOffset: null, options: []}),
    });

    await vi.waitFor(() => expect(wrapper.text()).toContain('No login flows found.'));
  });

  it('AuthFlowSelect loads authentication flows itself', async () => {
    vi.mocked(getFlows).mockResolvedValue({
      count: 1,
      flows: [{handle: 'password', id: 'flow-1', name: 'Password login'}],
      startIndex: 1,
      totalResults: 1,
    } as never);
    const wrapper = mountPicker(AuthFlowSelect);

    await waitForOptions(wrapper, 1);
    await chooseOption(findSelectControl(wrapper), 'Password login');

    expect(getFlows).toHaveBeenCalledWith(
      expect.objectContaining({
        baseUrl: 'https://thunder.example',
        flowType: 'AUTHENTICATION',
        limit: 30,
        offset: 0,
        url: 'https://rs.example.com/flows',
      }),
    );
    expect(wrapper.emitted('update:modelValue')).toEqual([['flow-1']]);
  });
});

describe('USER_TYPE_SELECT pickers (vue)', () => {
  afterEach(() => {
    mounted.splice(0).forEach((wrapper) => wrapper.unmount());
    vi.clearAllMocks();
  });

  it('BaseUserTypeSelect requests the first page when it renders, shows handles and emits the handle', async () => {
    const fetchUserTypes = vi.fn().mockResolvedValue({
      items: [
        {displayName: 'Staff', handle: 'employee', id: 'type-1'},
        {displayName: 'Staff', handle: 'contractor', id: 'type-2'},
      ],
      nextOffset: null,
    });
    const wrapper = mountPicker(BaseUserTypeSelect, {fetchUserTypes});

    await waitForOptions(wrapper, 2);
    expect(wrapper.text()).not.toContain('Staff');
    await chooseOption(findSelectControl(wrapper), 'contractor');

    expect(wrapper.emitted('update:modelValue')).toEqual([['contractor']]);
  });

  it('BaseUserTypeSelect shows the translated empty message', async () => {
    const wrapper = mountPicker(BaseUserTypeSelect, {
      fetchUserTypes: vi.fn().mockResolvedValue({nextOffset: null, options: []}),
    });

    await vi.waitFor(() => expect(wrapper.text()).toContain('No user types found.'));
  });

  it('UserTypeSelect loads user types itself', async () => {
    vi.mocked(getUserTypes).mockResolvedValue({
      count: 1,
      startIndex: 1,
      totalResults: 1,
      types: [{displayName: 'Staff', handle: 'employee', id: 'type-1'}],
    } as never);
    const wrapper = mountPicker(UserTypeSelect);

    await waitForOptions(wrapper, 1);
    await chooseOption(findSelectControl(wrapper), 'employee');

    expect(getUserTypes).toHaveBeenCalledWith(
      expect.objectContaining({
        baseUrl: 'https://thunder.example',
        limit: 30,
        offset: 0,
        url: 'https://rs.example.com/user-types',
      }),
    );
    expect(wrapper.emitted('update:modelValue')).toEqual([['employee']]);
  });
});
