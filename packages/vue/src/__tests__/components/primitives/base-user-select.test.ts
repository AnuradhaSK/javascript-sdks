// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {getDefaultI18nBundles, SelectConstants, substituteTranslationParams} from '@thunderid/browser';
import type {FetchUsers, SelectPage} from '@thunderid/browser';
import {mount} from '@vue/test-utils';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {ref} from 'vue';
import BaseUserSelect from '../../../components/primitives/UserSelect/BaseUserSelect';
import {I18N_KEY} from '../../../keys';
import type {I18nContextValue} from '../../../models/contexts';
import {chooseOption, findSelectControl, readSelectedLabel} from '../../helpers/selectControl';

/** Resolves keys through the real en-US bundle so assertions read actual user-facing copy. */
const createI18nContext = (): I18nContextValue =>
  ({
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
  }) as unknown as I18nContextValue;

const mounted: {unmount: () => void}[] = [];
const mountUserSelect = (props: Record<string, unknown> = {}, attrs: Record<string, unknown> = {}) => {
  const wrapper = mount(BaseUserSelect, {
    attachTo: document.body,
    attrs,
    global: {provide: {[I18N_KEY as symbol]: createI18nContext()}},
    props,
  });
  mounted.push(wrapper);
  return wrapper;
};
type UserSelectWrapper = ReturnType<typeof mountUserSelect>;

const LOAD_MORE = '.thunderid-select__load-more';

const users = (...names: string[]): {display: string; id: string}[] =>
  names.map((name: string, index: number) => ({display: name, id: `user-${index + 1}`}));

const page = (items: {display: string; id: string}[], nextOffset: number | null = null): SelectPage => ({
  items,
  nextOffset,
  totalResults: items.length,
});

const optionLabels = (wrapper: UserSelectWrapper): (string | null)[] =>
  Array.from((findSelectControl(wrapper).element as HTMLSelectElement).options)
    .filter((option) => option.value !== SelectConstants.LOAD_MORE_OPTION_VALUE)
    .map((option) => option.textContent);

const waitForOptions = (wrapper: UserSelectWrapper, count: number): Promise<void> =>
  vi.waitFor(() => expect(optionLabels(wrapper)).toHaveLength(count));

describe('BaseUserSelect (vue)', () => {
  afterEach(() => {
    mounted.splice(0).forEach((wrapper) => wrapper.unmount());
  });

  it('shows the placeholder first, and requests the first page when it renders', async () => {
    const fetchUsers: FetchUsers = vi.fn().mockResolvedValue(page(users('Jane Doe')));
    const wrapper = mountUserSelect({fetchUsers, modelValue: '', placeholder: 'Select a user'});

    await waitForOptions(wrapper, 2);

    expect(fetchUsers).toHaveBeenCalledTimes(1);
    expect(optionLabels(wrapper)).toEqual(['Select a user', 'Jane Doe']);
    expect(readSelectedLabel(findSelectControl(wrapper))).toBe('Select a user');
  });

  it('tells the host when the picker is left, so a required one can show its error', async () => {
    const onBlur = vi.fn();
    const fetchUsers: FetchUsers = vi.fn().mockResolvedValue(page(users('Jane Doe')));
    const wrapper = mountUserSelect({fetchUsers}, {onBlur});
    await waitForOptions(wrapper, 1);

    await findSelectControl(wrapper).trigger('blur');

    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it('keeps an accessible name when the label is an empty string', () => {
    const fetchUsers: FetchUsers = vi.fn().mockResolvedValue(page(users('Jane Doe')));
    const withPlaceholder = mountUserSelect({fetchUsers, label: '', placeholder: 'Pick an owner'});
    const withNothing = mountUserSelect({fetchUsers, label: ''});

    expect(findSelectControl(withPlaceholder).attributes('aria-label')).toBe('Pick an owner');
    expect(findSelectControl(withNothing).attributes('aria-label')).toBe('Select a user');
  });

  it('is disabled when the disabled prop is set', async () => {
    const fetchUsers: FetchUsers = vi.fn().mockResolvedValue(page(users('Jane Doe', 'John Roe'), 30));
    const wrapper = mountUserSelect({disabled: true, fetchUsers});

    await waitForOptions(wrapper, 2);

    expect(findSelectControl(wrapper).attributes('disabled')).toBeDefined();
  });

  it('requests exactly one first page, and lists the returned users', async () => {
    const fetchUsers: FetchUsers = vi.fn().mockResolvedValue(page(users('Jane Doe', 'John Roe')));
    const wrapper = mountUserSelect({fetchUsers});

    await waitForOptions(wrapper, 2);

    expect(fetchUsers).toHaveBeenCalledTimes(1);
    expect(fetchUsers).toHaveBeenCalledWith(expect.objectContaining({limit: 30, offset: 0}));
    expect(optionLabels(wrapper)).toEqual(['Jane Doe', 'John Roe']);
  });

  it("selecting an option emits the user's id, not the label", async () => {
    const fetchUsers: FetchUsers = vi.fn().mockResolvedValue(page(users('Jane Doe')));
    const wrapper = mountUserSelect({fetchUsers});

    await waitForOptions(wrapper, 1);
    await chooseOption(findSelectControl(wrapper), 'Jane Doe');

    expect(wrapper.emitted('update:modelValue')).toEqual([['user-1']]);
  });

  it('shows the selected user by name once its option is loaded', async () => {
    const fetchUsers: FetchUsers = vi.fn().mockResolvedValue(page(users('Jane Doe')));
    const wrapper = mountUserSelect({fetchUsers, modelValue: 'user-1'});

    await waitForOptions(wrapper, 1);

    expect(readSelectedLabel(findSelectControl(wrapper))).toBe('Jane Doe');
  });

  it('shows the name given for the selected user before its page has loaded', () => {
    const fetchUsers: FetchUsers = vi.fn().mockReturnValue(new Promise(() => undefined));
    const wrapper = mountUserSelect({
      fetchUsers,
      modelValue: 'user-9',
      selectedOption: {label: 'Ada Lovelace', value: 'user-9'},
    });

    expect(readSelectedLabel(findSelectControl(wrapper))).toBe('Ada Lovelace');
  });

  it('a disabled option is not selectable', async () => {
    const fetchUsers: FetchUsers = vi
      .fn()
      .mockResolvedValue({nextOffset: null, options: [{disabled: true, label: 'Suspended', value: 'user-1'}]});
    const wrapper = mountUserSelect({fetchUsers});

    await waitForOptions(wrapper, 1);

    expect((findSelectControl(wrapper).element as HTMLSelectElement).options[0].disabled).toBe(true);
  });

  it('hands a failed load to onError, shows no error text, and leaves Load more to try again', async () => {
    const failure: Error = new Error('boom');
    const fetchUsers: FetchUsers = vi.fn().mockRejectedValue(failure);
    const onError = vi.fn();
    const wrapper = mountUserSelect({fetchUsers, onError});

    await vi.waitFor(() => expect(onError).toHaveBeenCalledWith(failure));

    await vi.waitFor(() => expect(wrapper.find(LOAD_MORE).exists()).toBe(true));
    expect(wrapper.text()).not.toMatch(/boom|failed|retry/i);
  });

  it('loads the next page from the offset the page function returned, when Load more is pressed', async () => {
    const fetchUsers: FetchUsers = vi
      .fn()
      .mockResolvedValueOnce(page(users('User 1', 'User 2'), 2))
      .mockResolvedValueOnce(page([{display: 'User 3', id: 'user-3'}]));
    const wrapper = mountUserSelect({fetchUsers, pageSize: 2});
    await waitForOptions(wrapper, 2);
    expect(fetchUsers).toHaveBeenCalledTimes(1);

    await chooseOption(findSelectControl(wrapper), 'Load more');

    await waitForOptions(wrapper, 3);
    expect(fetchUsers).toHaveBeenNthCalledWith(2, expect.objectContaining({limit: 2, offset: 2}));
    expect(wrapper.find(LOAD_MORE).exists()).toBe(false);
  });

  it('keeps loading when a page maps to no options but more pages remain', async () => {
    const fetchUsers: FetchUsers = vi
      .fn()
      .mockResolvedValueOnce({nextOffset: 30, options: []})
      .mockResolvedValueOnce(page(users('Jane Doe')));
    const wrapper = mountUserSelect({fetchUsers});

    await waitForOptions(wrapper, 1);

    expect(fetchUsers).toHaveBeenNthCalledWith(2, expect.objectContaining({offset: 30}));
    expect(wrapper.text()).not.toContain('No users found');
  });

  it('shows the empty message only once the list is genuinely exhausted', async () => {
    const fetchUsers: FetchUsers = vi.fn().mockResolvedValue({nextOffset: null, options: []});
    const wrapper = mountUserSelect({fetchUsers});

    await vi.waitFor(() => expect(wrapper.text()).toContain('No users found.'));
    expect(wrapper.find(LOAD_MORE).exists()).toBe(false);
  });
});
