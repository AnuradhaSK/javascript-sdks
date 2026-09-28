// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {act, cleanup, fireEvent, render, screen, waitFor} from '@testing-library/react';
import {EmbeddedFlowComponentType, SelectConstants, ThunderIDAPIError} from '@thunderid/browser';
import type {FetchSelectPage, SelectPage, SelectPageRequest} from '@thunderid/browser';
import {ReactElement, StrictMode} from 'react';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {chooseOption} from './selectTestUtils';
import I18nProvider from '../../../../contexts/I18n/I18nProvider';
import ThemeProvider from '../../../../contexts/Theme/ThemeProvider';
import ResourceSelect, {ResourceSelectProps} from '../ResourceSelect';

const withProviders = (ui: ReactElement): ReactElement => (
  <I18nProvider>
    <ThemeProvider>{ui}</ThemeProvider>
  </I18nProvider>
);

const FALLBACK_MESSAGES = {ariaLabel: 'Fallback aria', empty: 'Fallback empty'};

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

const pickerElement = (props: Partial<ResourceSelectProps> = {}): ReactElement =>
  withProviders(
    <ResourceSelect
      bemBlock="thing-select"
      fallbackMessages={FALLBACK_MESSAGES}
      label="Thing"
      messageKey="user_select"
      resource="things"
      type={EmbeddedFlowComponentType.Select}
      {...props}
    />,
  );

const renderResource = (props: Partial<ResourceSelectProps> = {}) => render(pickerElement(props));

const control = (): HTMLSelectElement => screen.getByRole<HTMLSelectElement>('combobox', {name: 'Thing'});

const loadedOptions = (select: HTMLSelectElement): HTMLOptionElement[] =>
  Array.from(select.options).filter((option) => option.value !== SelectConstants.LOAD_MORE_OPTION_VALUE);

const optionCount = (): number => loadedOptions(control()).length;

const loadMoreOption = (): HTMLElement | null => screen.queryByRole('option', {name: /load more/i});

const chooseLoadMore = (select: HTMLElement = control()): void => chooseOption(select, 'Load more');

const settle = async (): Promise<void> => {
  await act(async () => {
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 100);
    });
  });
};

describe('ResourceSelect', () => {
  afterEach(cleanup);

  describe('loading', () => {
    it('requests the first page of the default size once, when it renders', async () => {
      const fetchPage: FetchSelectPage = vi.fn().mockResolvedValue(page(0, 30, 75));
      renderResource({fetchPage, filter: 'active'});

      await waitFor(() => expect(optionCount()).toBe(30));

      expect(fetchPage).toHaveBeenCalledTimes(1);
      const [request] = (fetchPage as ReturnType<typeof vi.fn>).mock.calls[0] as [SelectPageRequest];
      expect(request).toMatchObject({filter: 'active', limit: 30, offset: 0});
      expect(request.signal).toBeInstanceOf(AbortSignal);
    });

    it('requests the first page once under StrictMode too', async () => {
      const fetchPage: FetchSelectPage = vi.fn().mockResolvedValue(page(0, 5, 5));
      render(<StrictMode>{pickerElement({fetchPage})}</StrictMode>);

      await waitFor(() => expect(optionCount()).toBe(5));
    });

    it('requests nothing without a page function', async () => {
      renderResource({});

      await settle();

      expect(optionCount()).toBe(0);
    });

    it('passes the flow component and the signal to the page function', async () => {
      const fetchPage: FetchSelectPage = vi.fn().mockResolvedValue(page(0, 3, 3));
      renderResource({fetchPage, id: 'thing_input', name: 'thing'});

      await waitFor(() => expect(fetchPage).toHaveBeenCalled());
      const [request] = (fetchPage as ReturnType<typeof vi.fn>).mock.calls[0] as [
        {component: {id: string; type: string}},
      ];
      expect(request.component).toMatchObject({id: 'thing_input', type: EmbeddedFlowComponentType.Select});
    });

    it('shows a loading message while the first page loads', async () => {
      const fetchPage: FetchSelectPage = vi.fn().mockReturnValue(new Promise(() => undefined));
      renderResource({fetchPage});

      await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Loading…'));
      expect(loadMoreOption()).toBeNull();
    });

    it('offers Load more while there are more pages, and loads the next page from the offset the page function returned', async () => {
      const fetchPage = vi
        .fn<FetchSelectPage>()
        .mockResolvedValueOnce(page(0, 30, 75))
        .mockResolvedValueOnce(page(30, 30, 75));
      renderResource({fetchPage});
      await waitFor(() => expect(optionCount()).toBe(30));

      chooseLoadMore();

      await waitFor(() => expect(optionCount()).toBe(60));
      expect(fetchPage).toHaveBeenNthCalledWith(2, expect.objectContaining({limit: 30, offset: 30}));
    });

    it('does not request the next page until Load more is pressed', async () => {
      const fetchPage = vi.fn<FetchSelectPage>().mockResolvedValue(page(0, 30, 75));
      renderResource({fetchPage});
      await waitFor(() => expect(optionCount()).toBe(30));

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
      renderResource({fetchPage});
      await waitFor(() => expect(optionCount()).toBe(30));

      chooseLoadMore();

      const waiting = await screen.findByRole('option', {name: /loading more/i});
      expect(waiting).toBeDisabled();
      act(() => finish(page(30, 30, 75)));
      await waitFor(() => expect(optionCount()).toBe(60));
    });

    it('hides Load more after the last page', async () => {
      const fetchPage = vi.fn<FetchSelectPage>().mockResolvedValue(page(0, 10, 10));
      renderResource({fetchPage});

      await waitFor(() => expect(optionCount()).toBe(10));

      expect(loadMoreOption()).toBeNull();
      expect(fetchPage).toHaveBeenCalledTimes(1);
    });

    it('uses the given page size', async () => {
      const fetchPage = vi.fn<FetchSelectPage>().mockResolvedValue(page(0, 5, 5));
      renderResource({fetchPage, pageSize: 5});

      await waitFor(() => expect(fetchPage).toHaveBeenCalledWith(expect.objectContaining({limit: 5})));
    });

    it.each([
      [500, 100],
      [101, 100],
      [0, 1],
      [-4, 1],
      [12.7, 12],
    ])('turns a page size of %s into %s', async (requested: number, used: number) => {
      const fetchPage = vi.fn<FetchSelectPage>().mockResolvedValue(page(0, 1, 1));
      renderResource({fetchPage, pageSize: requested});

      await waitFor(() => expect(fetchPage).toHaveBeenCalledWith(expect.objectContaining({limit: used})));
    });

    it('shows the options as labels and submits their values', async () => {
      const fetchPage = vi.fn<FetchSelectPage>().mockResolvedValue(page(0, 3, 3));
      const onChange = vi.fn<(event: {target: HTMLSelectElement}) => void>();
      renderResource({fetchPage, onChange});
      await waitFor(() => expect(optionCount()).toBe(3));

      fireEvent.change(control(), {target: {value: 'thing-2'}});

      expect(Array.from(control().options).map((option) => option.textContent)).toEqual([
        'Thing 1',
        'Thing 2',
        'Thing 3',
      ]);
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange.mock.calls[0][0].target.value).toBe('thing-2');
    });

    it('shows the empty text of the picker when there is no page function', () => {
      renderResource({});

      expect(screen.getByText('No users found.')).toBeInTheDocument();
    });

    it('shows the empty text when the only page has no options', async () => {
      const fetchPage = vi.fn<FetchSelectPage>().mockResolvedValue(page(0, 0, 0));
      renderResource({fetchPage});

      expect(await screen.findByText('No users found.')).toBeInTheDocument();
      expect(loadMoreOption()).toBeNull();
    });

    it('maps raw items with the given mapping', async () => {
      const fetchPage = vi.fn<FetchSelectPage>().mockResolvedValue({
        items: [{code: 'x1', title: 'First'}],
        nextOffset: null,
      });
      renderResource({fetchPage, mapping: {labelAttributes: ['title'], valueAttribute: 'code'}});

      await waitFor(() => expect(screen.getByRole('option', {name: 'First'})).toBeInTheDocument());
    });
  });

  describe('restarting', () => {
    it('starts over from the first page when the filter changes', async () => {
      const fetchPage = vi.fn<FetchSelectPage>().mockResolvedValue(page(0, 3, 3));
      const {rerender} = renderResource({fetchPage, filter: 'a'});
      await waitFor(() => expect(optionCount()).toBe(3));

      rerender(pickerElement({fetchPage, filter: 'b'}));

      await waitFor(() => expect(fetchPage).toHaveBeenCalledTimes(2));
      expect(fetchPage).toHaveBeenLastCalledWith(expect.objectContaining({filter: 'b', offset: 0}));
    });

    it('starts over from the first page when the page function changes', async () => {
      const first = vi.fn<FetchSelectPage>().mockResolvedValue(page(0, 30, 75));
      const second = vi.fn<FetchSelectPage>().mockResolvedValue(page(0, 4, 4));
      const {rerender} = renderResource({fetchPage: first});
      await waitFor(() => expect(optionCount()).toBe(30));

      rerender(pickerElement({fetchPage: second}));

      await waitFor(() => expect(optionCount()).toBe(4));
      expect(second).toHaveBeenCalledTimes(1);
      expect(second).toHaveBeenCalledWith(expect.objectContaining({offset: 0}));
    });

    it('loads the first page once a page function arrives after the first render', async () => {
      const fetchPage = vi.fn<FetchSelectPage>().mockResolvedValue(page(0, 3, 3));
      const {rerender} = renderResource({});

      rerender(pickerElement({fetchPage}));

      await waitFor(() => expect(optionCount()).toBe(3));
      expect(fetchPage).toHaveBeenCalledTimes(1);
    });

    it('does not reload when the parent passes a new mapping object on every render', async () => {
      const fetchPage = vi
        .fn<FetchSelectPage>()
        .mockResolvedValue({items: [{code: 'x1', title: 'First'}], nextOffset: null});
      const element = (): ReactElement =>
        pickerElement({fetchPage, mapping: {labelAttributes: ['title'], valueAttribute: 'code'}});
      const {rerender} = render(element());
      await waitFor(() => expect(optionCount()).toBe(1));

      rerender(element());
      rerender(element());
      await settle();

      expect(fetchPage).toHaveBeenCalledTimes(1);
      expect(optionCount()).toBe(1);
    });

    it('keeps the cursors of two pickers apart', async () => {
      const fetchFirst = vi
        .fn<FetchSelectPage>()
        .mockResolvedValueOnce(page(0, 30, 90))
        .mockResolvedValueOnce(page(30, 30, 90));
      const fetchSecond = vi.fn<FetchSelectPage>().mockResolvedValue(page(0, 4, 4));
      render(
        withProviders(
          <>
            <ResourceSelect
              bemBlock="a-select"
              fallbackMessages={FALLBACK_MESSAGES}
              fetchPage={fetchFirst}
              label="First"
              messageKey="user_select"
              resource="things"
              type={EmbeddedFlowComponentType.Select}
            />
            <ResourceSelect
              bemBlock="b-select"
              fallbackMessages={FALLBACK_MESSAGES}
              fetchPage={fetchSecond}
              label="Second"
              messageKey="user_select"
              resource="things"
              type={EmbeddedFlowComponentType.Select}
            />
          </>,
        ),
      );
      const first = (): HTMLSelectElement => screen.getByRole<HTMLSelectElement>('combobox', {name: 'First'});
      await waitFor(() => expect(loadedOptions(first())).toHaveLength(30));

      chooseLoadMore(first());

      await waitFor(() => expect(loadedOptions(first())).toHaveLength(60));
      expect(fetchFirst).toHaveBeenLastCalledWith(expect.objectContaining({offset: 30}));
      expect(fetchSecond).toHaveBeenCalledTimes(1);
    });
  });

  describe('failures', () => {
    it('retries a server error once and shows the second result without reporting an error', async () => {
      const fetchPage = vi
        .fn<FetchSelectPage>()
        .mockRejectedValueOnce(apiError(503))
        .mockResolvedValue(page(0, 3, 3));
      const onError = vi.fn();
      renderResource({fetchPage, onError});

      await waitFor(() => expect(optionCount()).toBe(3), {timeout: 3000});

      expect(fetchPage).toHaveBeenCalledTimes(2);
      expect(onError).not.toHaveBeenCalled();
    });

    it('reports a client error at once without retrying and shows no error text', async () => {
      const failure: ThunderIDAPIError = apiError(403);
      const fetchPage = vi.fn<FetchSelectPage>().mockRejectedValue(failure);
      const onError = vi.fn();
      renderResource({fetchPage, onError});

      await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));

      expect(onError).toHaveBeenCalledWith(failure);
      expect(fetchPage).toHaveBeenCalledTimes(1);
      expect(screen.queryByText(/nope|failed|error/i)).not.toBeInTheDocument();
    });

    it('lets Load more try the first page again after it failed', async () => {
      const fetchPage = vi
        .fn<FetchSelectPage>()
        .mockRejectedValueOnce(apiError(403))
        .mockResolvedValue(page(0, 3, 3));
      renderResource({fetchPage});
      await waitFor(() => expect(fetchPage).toHaveBeenCalledTimes(1));

      await screen.findByRole('option', {name: /load more/i});
      chooseLoadMore();

      await waitFor(() => expect(optionCount()).toBe(3));
      expect(fetchPage).toHaveBeenLastCalledWith(expect.objectContaining({offset: 0}));
    });

    it('keeps the options already loaded when a later page fails, and Load more stays available', async () => {
      const fetchPage = vi
        .fn<FetchSelectPage>()
        .mockResolvedValueOnce(page(0, 30, 75))
        .mockRejectedValueOnce(apiError(404));
      const onError = vi.fn();
      renderResource({fetchPage, onError});
      await waitFor(() => expect(optionCount()).toBe(30));

      chooseLoadMore();

      await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
      expect(optionCount()).toBe(30);
      expect(loadMoreOption()).not.toBeNull();
    });

    it('works without an onError callback', async () => {
      const fetchPage = vi.fn<FetchSelectPage>().mockRejectedValue(apiError(403));
      renderResource({fetchPage});

      await waitFor(() => expect(fetchPage).toHaveBeenCalledTimes(1));
      await settle();

      expect(optionCount()).toBe(0);
    });
  });

  describe('wording and class', () => {
    it('adds the vendor class of the picker', () => {
      const {container} = renderResource({});

      expect(container.querySelector('[class*="thing-select"]')).not.toBeNull();
    });

    it('names the control after its label', () => {
      renderResource({});

      expect(screen.getByRole('combobox', {name: 'Thing'})).toBeInTheDocument();
    });

    it('names the control from the picker translation when there is no label or placeholder', () => {
      renderResource({label: undefined});

      expect(screen.getByRole('combobox', {name: 'Select a user'})).toBeInTheDocument();
    });

    it('lets the caller replace the empty text', () => {
      renderResource({emptyText: 'Nothing to pick'});

      expect(screen.getByText('Nothing to pick')).toBeInTheDocument();
    });
  });
});
