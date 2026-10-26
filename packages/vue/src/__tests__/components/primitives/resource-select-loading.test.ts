// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {
  EmbeddedFlowComponentType,
  getDefaultI18nBundles,
  SelectConstants,
  substituteTranslationParams,
  ThunderIDAPIError,
} from '@thunderid/browser';
import type {FetchSelectPage, SelectPage, SelectPageRequest} from '@thunderid/browser';
import {mount} from '@vue/test-utils';
import {afterEach, beforeAll, describe, expect, it, vi} from 'vitest';
import {ref} from 'vue';
import ResourceSelect from '../../../components/primitives/Select/ResourceSelect';
import {I18N_KEY} from '../../../keys';
import {injectStyles} from '../../../styles/injectStyles';
import {chooseOption, findSelectControl} from '../../helpers/selectControl';

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

const page = (start: number, count: number, totalResults: number): SelectPage => ({
  nextOffset: start + count < totalResults ? start + count : null,
  options: Array.from({length: count}, (_, index) => ({
    label: `Thing ${start + index + 1}`,
    value: `thing-${start + index + 1}`,
  })),
  totalResults,
});

const apiError = (statusCode: number): ThunderIDAPIError =>
  new ThunderIDAPIError('nope', 'getThings-ResponseError-001', 'javascript', statusCode);

const mounted: {unmount: () => void}[] = [];
const mountResource = (props: Record<string, unknown> = {}) => {
  const wrapper = mount(ResourceSelect, {
    attachTo: document.body,
    global: {provide: {[I18N_KEY as symbol]: i18n}},
    props: {
      bemBlock: 'thing-select',
      fallbackMessages: {ariaLabel: 'Fallback aria', empty: 'Fallback empty'},
      label: 'Thing',
      messageKey: 'user_select',
      resource: 'things',
      type: EmbeddedFlowComponentType.Select,
      ...props,
    },
  });
  mounted.push(wrapper);

  return wrapper;
};
type ResourceWrapper = ReturnType<typeof mountResource>;

const LOAD_MORE = '.thunderid-select__load-more';

const optionCount = (wrapper: ResourceWrapper): number =>
  Array.from((findSelectControl(wrapper).element as HTMLSelectElement).options).filter(
    (option) => option.value !== SelectConstants.LOAD_MORE_OPTION_VALUE,
  ).length;

const chooseLoadMore = (wrapper: ResourceWrapper): Promise<void> =>
  chooseOption(findSelectControl(wrapper), 'Load more');

const waitForOptions = (wrapper: ResourceWrapper, count: number): Promise<void> =>
  vi.waitFor(() => expect(optionCount(wrapper)).toBe(count));

const settle = (): Promise<void> =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, 100);
  });

describe('ResourceSelect (vue)', () => {
  beforeAll(() => {
    injectStyles();
  });

  afterEach(() => {
    mounted.splice(0).forEach((wrapper) => wrapper.unmount());
  });

  describe('loading', () => {
    it('requests the first page of the default size once, when it renders, with the filter and a signal', async () => {
      const fetchPage = vi.fn<FetchSelectPage>().mockResolvedValue(page(0, 30, 75));
      const wrapper = mountResource({fetchPage, filter: 'active', id: 'thing_input'});

      await waitForOptions(wrapper, 30);

      expect(fetchPage).toHaveBeenCalledTimes(1);
      const [request] = fetchPage.mock.calls[0] as [SelectPageRequest];
      expect(request).toMatchObject({filter: 'active', limit: 30, offset: 0});
      expect(request.signal).toBeInstanceOf(AbortSignal);
      expect(request.component).toMatchObject({id: 'thing_input', type: EmbeddedFlowComponentType.Select});
    });

    it('requests nothing without a page function', async () => {
      const wrapper = mountResource();

      await settle();

      expect(optionCount(wrapper)).toBe(0);
    });

    it('shows a loading message, and no Load more option, while the first page loads', async () => {
      const fetchPage: FetchSelectPage = vi.fn().mockReturnValue(new Promise(() => undefined));
      const wrapper = mountResource({fetchPage});

      await vi.waitFor(() => expect(wrapper.find('[role="status"]').text()).toBe('Loading…'));
      expect(wrapper.find(LOAD_MORE).exists()).toBe(false);
    });

    it('offers Load more while there are more pages, and loads the next page from the offset the page function returned', async () => {
      const fetchPage = vi
        .fn<FetchSelectPage>()
        .mockResolvedValueOnce(page(0, 30, 75))
        .mockResolvedValueOnce(page(30, 30, 75));
      const wrapper = mountResource({fetchPage});
      await waitForOptions(wrapper, 30);

      await chooseLoadMore(wrapper);

      await waitForOptions(wrapper, 60);
      expect(fetchPage).toHaveBeenNthCalledWith(2, expect.objectContaining({limit: 30, offset: 30}));
    });

    it('does not request the next page until Load more is pressed', async () => {
      const fetchPage = vi.fn<FetchSelectPage>().mockResolvedValue(page(0, 30, 75));
      const wrapper = mountResource({fetchPage});
      await waitForOptions(wrapper, 30);

      await settle();

      expect(fetchPage).toHaveBeenCalledTimes(1);
    });

    it('waits on the option while the next page loads', async () => {
      let finish: (value: SelectPage) => void = () => undefined;
      const fetchPage = vi
        .fn<FetchSelectPage>()
        .mockResolvedValueOnce(page(0, 30, 75))
        .mockReturnValueOnce(
          new Promise<SelectPage>((resolve) => {
            finish = resolve;
          }),
        );
      const wrapper = mountResource({fetchPage});
      await waitForOptions(wrapper, 30);

      await chooseLoadMore(wrapper);

      await vi.waitFor(() => expect(wrapper.find(LOAD_MORE).text()).toContain('Loading more…'));
      expect(wrapper.find(LOAD_MORE).attributes('disabled')).toBeDefined();
      finish(page(30, 30, 75));
      await waitForOptions(wrapper, 60);
    });

    it('hides Load more after the last page', async () => {
      const fetchPage = vi.fn<FetchSelectPage>().mockResolvedValue(page(0, 10, 10));
      const wrapper = mountResource({fetchPage});

      await waitForOptions(wrapper, 10);

      expect(wrapper.find(LOAD_MORE).exists()).toBe(false);
      expect(fetchPage).toHaveBeenCalledTimes(1);
    });

    it.each([
      [500, 100],
      [0, 1],
      [-4, 1],
      [12.7, 12],
    ])('turns a page size of %s into %s', async (requested: number, used: number) => {
      const fetchPage = vi.fn<FetchSelectPage>().mockResolvedValue(page(0, 1, 1));
      mountResource({fetchPage, pageSize: requested});

      await vi.waitFor(() => expect(fetchPage).toHaveBeenCalledWith(expect.objectContaining({limit: used})));
    });

    it('shows the options as labels and submits their values', async () => {
      const fetchPage = vi.fn<FetchSelectPage>().mockResolvedValue(page(0, 3, 3));
      const wrapper = mountResource({fetchPage});
      await waitForOptions(wrapper, 3);

      await chooseOption(findSelectControl(wrapper), 'Thing 2');

      expect(wrapper.emitted('update:modelValue')).toEqual([['thing-2']]);
    });

    it('shows the empty text of the picker when there is no page function', () => {
      const wrapper = mountResource();

      expect(wrapper.find('[role="status"]').text()).toBe('No users found.');
    });

    it('shows the empty text when the only page has no options', async () => {
      const wrapper = mountResource({fetchPage: vi.fn<FetchSelectPage>().mockResolvedValue(page(0, 0, 0))});

      await vi.waitFor(() => expect(wrapper.find('[role="status"]').text()).toBe('No users found.'));
      expect(wrapper.find(LOAD_MORE).exists()).toBe(false);
    });

    it('names the control after its label', () => {
      const wrapper = mountResource();

      expect(findSelectControl(wrapper).attributes('aria-label')).toBe('Thing');
    });

    it('names the control from the picker translation when there is no label or placeholder', () => {
      const wrapper = mountResource({label: undefined});

      expect(findSelectControl(wrapper).attributes('aria-label')).toBe('Select a user');
    });
  });

  describe('restarting', () => {
    it('starts over from the first page when the filter changes', async () => {
      const fetchPage = vi.fn<FetchSelectPage>().mockResolvedValue(page(0, 3, 3));
      const wrapper = mountResource({fetchPage, filter: 'a'});
      await waitForOptions(wrapper, 3);

      await wrapper.setProps({filter: 'b'});

      await vi.waitFor(() => expect(fetchPage).toHaveBeenCalledTimes(2));
      expect(fetchPage).toHaveBeenLastCalledWith(expect.objectContaining({filter: 'b', offset: 0}));
    });

    it('starts over from the first page when the page function changes', async () => {
      const first = vi.fn<FetchSelectPage>().mockResolvedValue(page(0, 30, 75));
      const second = vi.fn<FetchSelectPage>().mockResolvedValue(page(0, 4, 4));
      const wrapper = mountResource({fetchPage: first});
      await waitForOptions(wrapper, 30);

      await wrapper.setProps({fetchPage: second});

      await waitForOptions(wrapper, 4);
      expect(second).toHaveBeenCalledTimes(1);
      expect(second).toHaveBeenCalledWith(expect.objectContaining({offset: 0}));
    });

    it('loads the first page once a page function arrives after the first render', async () => {
      const fetchPage = vi.fn<FetchSelectPage>().mockResolvedValue(page(0, 3, 3));
      const wrapper = mountResource();

      await wrapper.setProps({fetchPage});

      await waitForOptions(wrapper, 3);
      expect(fetchPage).toHaveBeenCalledTimes(1);
    });

    it('does not reload when the parent passes a new mapping object, and uses the new one for the next page', async () => {
      const fetchPage = vi
        .fn<FetchSelectPage>()
        .mockResolvedValue({items: [{code: 'x1', title: 'First'}], nextOffset: null});
      const wrapper = mountResource({fetchPage, mapping: {labelAttributes: ['title'], valueAttribute: 'code'}});
      await waitForOptions(wrapper, 1);

      await wrapper.setProps({mapping: {labelAttributes: ['title'], valueAttribute: 'code'}});
      await settle();

      expect(fetchPage).toHaveBeenCalledTimes(1);
    });
  });

  describe('failures', () => {
    it('retries a server error once and shows the second result without reporting an error', async () => {
      const fetchPage = vi
        .fn<FetchSelectPage>()
        .mockRejectedValueOnce(apiError(503))
        .mockResolvedValue(page(0, 3, 3));
      const onError = vi.fn();
      const wrapper = mountResource({fetchPage, onError});

      await vi.waitFor(() => expect(optionCount(wrapper)).toBe(3), {timeout: 3000});

      expect(fetchPage).toHaveBeenCalledTimes(2);
      expect(onError).not.toHaveBeenCalled();
    });

    it('reports a client error at once without retrying and shows no error text', async () => {
      const failure: ThunderIDAPIError = apiError(403);
      const fetchPage = vi.fn<FetchSelectPage>().mockRejectedValue(failure);
      const onError = vi.fn();
      const wrapper = mountResource({fetchPage, onError});

      await vi.waitFor(() => expect(onError).toHaveBeenCalledTimes(1));

      expect(onError).toHaveBeenCalledWith(failure);
      expect(fetchPage).toHaveBeenCalledTimes(1);
      expect(wrapper.text()).not.toMatch(/nope|failed/i);
    });

    it('lets Load more try the first page again after it failed', async () => {
      const fetchPage = vi
        .fn<FetchSelectPage>()
        .mockRejectedValueOnce(apiError(403))
        .mockResolvedValue(page(0, 3, 3));
      const wrapper = mountResource({fetchPage});
      await vi.waitFor(() => expect(fetchPage).toHaveBeenCalledTimes(1));
      await vi.waitFor(() => expect(wrapper.find(LOAD_MORE).exists()).toBe(true));

      await chooseLoadMore(wrapper);

      await waitForOptions(wrapper, 3);
      expect(fetchPage).toHaveBeenLastCalledWith(expect.objectContaining({offset: 0}));
    });

    it('keeps the options already loaded when a later page fails, and Load more stays available', async () => {
      const fetchPage = vi
        .fn<FetchSelectPage>()
        .mockResolvedValueOnce(page(0, 30, 75))
        .mockRejectedValueOnce(apiError(404));
      const onError = vi.fn();
      const wrapper = mountResource({fetchPage, onError});
      await waitForOptions(wrapper, 30);

      await chooseLoadMore(wrapper);

      await vi.waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
      expect(optionCount(wrapper)).toBe(30);
      await vi.waitFor(() => expect(wrapper.find(LOAD_MORE).exists()).toBe(true));
    });

    it('works without an onError callback', async () => {
      const fetchPage = vi.fn<FetchSelectPage>().mockRejectedValue(apiError(403));
      const wrapper = mountResource({fetchPage});

      await vi.waitFor(() => expect(fetchPage).toHaveBeenCalledTimes(1));
      await settle();

      expect(optionCount(wrapper)).toBe(0);
    });
  });
});
