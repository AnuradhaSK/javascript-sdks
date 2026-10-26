// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {getDefaultI18nBundles, substituteTranslationParams} from '@thunderid/browser';
import {mount} from '@vue/test-utils';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {ref} from 'vue';
import UserSelect from '../../../components/primitives/UserSelect/UserSelect';
import {I18N_KEY} from '../../../keys';
import {chooseOption, findSelectControl} from '../../helpers/selectControl';

const mocks = vi.hoisted(() => ({
  getUsers: vi.fn(),
  thunderID: {
    baseUrl: 'https://thunder.example',
    endpoints: {users: 'https://rs.example.com/users'} as {users?: string},
  },
}));

vi.mock('../../../api/management/getUsers', () => ({default: mocks.getUsers}));
vi.mock('../../../composables/useThunderID', () => ({default: () => mocks.thunderID}));

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

const mounted: {unmount: () => void}[] = [];
const mountUserSelect = () => {
  const wrapper = mount(UserSelect, {
    attachTo: document.body,
    global: {provide: {[I18N_KEY as symbol]: i18n}},
    props: {label: 'Owner'},
  });
  mounted.push(wrapper);
  return wrapper;
};

describe('UserSelect (vue)', () => {
  afterEach(() => {
    mounted.splice(0).forEach((wrapper) => wrapper.unmount());
    mocks.getUsers.mockReset();
  });

  it('requests the first page once, when it renders', async () => {
    mocks.getUsers.mockResolvedValue({count: 0, startIndex: 1, totalResults: 0, users: []});
    mountUserSelect();

    await vi.waitFor(() => expect(mocks.getUsers).toHaveBeenCalledTimes(1));
  });

  it('loads the user directory itself and submits the chosen ID', async () => {
    mocks.getUsers.mockResolvedValue({
      count: 2,
      startIndex: 1,
      totalResults: 2,
      users: [
        {display: 'Jane Doe', id: 'user-1'},
        {display: 'John Roe', id: 'user-2'},
      ],
    });
    const wrapper = mountUserSelect();

    await vi.waitFor(() => expect((findSelectControl(wrapper).element as HTMLSelectElement).options).toHaveLength(2));
    await chooseOption(findSelectControl(wrapper), 'Jane Doe');

    expect(mocks.getUsers).toHaveBeenCalledWith(
      expect.objectContaining({
        baseUrl: 'https://thunder.example',
        limit: 30,
        offset: 0,
        url: 'https://rs.example.com/users',
      }),
    );
    expect(wrapper.emitted('update:modelValue')).toEqual([['user-1']]);
  });
});
