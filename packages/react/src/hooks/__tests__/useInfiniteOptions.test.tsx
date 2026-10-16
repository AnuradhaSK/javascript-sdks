// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {act, cleanup, render, renderHook, waitFor} from '@testing-library/react';
import {StrictMode, useEffect} from 'react';
import {afterEach, describe, expect, it, vi} from 'vitest';
import useInfiniteOptions, {
  InfiniteOptionsBatch,
  InfiniteOptionsLoadContext,
  UseInfiniteOptionsArgs,
  UseInfiniteOptionsResult,
} from '../useInfiniteOptions';

const warn = vi.hoisted(() => vi.fn());
const logError = vi.hoisted(() => vi.fn());

vi.mock('@thunderid/browser', async (importOriginal: () => Promise<Record<string, unknown>>) => ({
  ...(await importOriginal()),
  createPackageComponentLogger: () => ({debug: vi.fn(), error: logError, info: vi.fn(), warn}),
}));

type Load = UseInfiniteOptionsArgs<number>['load'];

const batch = (values: string[], nextCursor?: number | null): InfiniteOptionsBatch<number> => ({
  nextCursor,
  options: values,
});

const valuesOf = (result: {current: UseInfiniteOptionsResult}): string[] =>
  result.current.options.map((option) => option.value);

const callLoadMore = async (result: {current: UseInfiniteOptionsResult}): Promise<void> => {
  await act(() => Promise.resolve(result.current.onLoadMore()));
};

describe('useInfiniteOptions', () => {
  afterEach(() => {
    cleanup();
    warn.mockClear();
    logError.mockClear();
  });

  describe('initial state', () => {
    it('starts with the initial options, idle and with more to load, and loads nothing by itself', () => {
      const load = vi.fn();

      const {result} = renderHook(() => useInfiniteOptions({initialOptions: ['A', 7], load}));

      expect(result.current.options).toEqual([
        {label: 'A', value: 'A'},
        {label: '7', value: '7'},
      ]);
      expect(result.current).toMatchObject({error: null, hasMore: true, loading: false});
      expect(load).not.toHaveBeenCalled();
    });

    it('starts empty without initial options', () => {
      const {result} = renderHook(() => useInfiniteOptions({load: vi.fn()}));

      expect(result.current.options).toEqual([]);
    });
  });

  describe('cursor batches', () => {
    it('passes no cursor first, then the cursor of the previous batch, with the options loaded so far', async () => {
      const load = vi
        .fn<Load>()
        .mockResolvedValueOnce(batch(['a', 'b'], 2))
        .mockResolvedValueOnce(batch(['c'], null));
      const {result} = renderHook(() => useInfiniteOptions<number>({load}));

      await callLoadMore(result);
      await callLoadMore(result);

      const [first, second] = load.mock.calls.map(([context]: [InfiniteOptionsLoadContext<number>]) => context);
      expect(first.cursor).toBeUndefined();
      expect(first.options).toEqual([]);
      expect(second.cursor).toBe(2);
      expect(second.options.map((option) => option.value)).toEqual(['a', 'b']);
      expect(first.signal).toBeInstanceOf(AbortSignal);
    });

    it('appends each batch in order', async () => {
      const load = vi
        .fn<Load>()
        .mockResolvedValueOnce(batch(['a', 'b'], 2))
        .mockResolvedValueOnce(batch(['c'], 3));
      const {result} = renderHook(() => useInfiniteOptions<number>({load}));

      await callLoadMore(result);
      await callLoadMore(result);

      expect(valuesOf(result)).toEqual(['a', 'b', 'c']);
      expect(result.current.hasMore).toBe(true);
    });

    it('stops when the cursor is null and ignores later calls', async () => {
      const load = vi.fn<Load>().mockResolvedValue(batch(['a'], null));
      const {result} = renderHook(() => useInfiniteOptions<number>({load}));

      await callLoadMore(result);
      await callLoadMore(result);

      expect(result.current.hasMore).toBe(false);
      expect(load).toHaveBeenCalledTimes(1);
    });

    it('stops when the cursor is missing', async () => {
      const load = vi.fn<Load>().mockResolvedValue({options: ['a']});
      const {result} = renderHook(() => useInfiniteOptions<number>({load}));

      await callLoadMore(result);

      expect(result.current.hasMore).toBe(false);
    });

    it('keeps going by itself when a batch holds only duplicates but the cursor advances', async () => {
      const load = vi
        .fn<Load>()
        .mockResolvedValueOnce(batch(['a'], 1))
        .mockResolvedValueOnce(batch(['a'], 2))
        .mockResolvedValueOnce(batch(['b'], null));
      const {result} = renderHook(() => useInfiniteOptions<number>({load}));

      await callLoadMore(result);
      await callLoadMore(result);

      expect(load).toHaveBeenCalledTimes(3);
      expect(load.mock.calls.map(([context]: [InfiniteOptionsLoadContext<number>]) => context.cursor)).toEqual([
        undefined,
        1,
        2,
      ]);
      expect(valuesOf(result)).toEqual(['a', 'b']);
      expect(result.current.hasMore).toBe(false);
      expect(warn).not.toHaveBeenCalled();
    });

    it('keeps going through pages that add nothing, but only a few in a row', async () => {
      let cursor = 0;
      const load = vi.fn<Load>().mockImplementation(() => {
        cursor += 1;

        return Promise.resolve(batch([], cursor));
      });
      const {result} = renderHook(() => useInfiniteOptions<number>({load}));

      await callLoadMore(result);
      expect(load).toHaveBeenCalledTimes(4);
      expect(result.current.hasMore).toBe(true);
      expect(result.current.loading).toBe(false);

      await callLoadMore(result);
      expect(load).toHaveBeenCalledTimes(8);
    });

    it('stops continuing as soon as a batch adds options', async () => {
      const load = vi
        .fn<Load>()
        .mockResolvedValueOnce(batch([], 1))
        .mockResolvedValueOnce(batch(['a'], 2));
      const {result} = renderHook(() => useInfiniteOptions<number>({load}));

      await callLoadMore(result);

      expect(load).toHaveBeenCalledTimes(2);
      expect(valuesOf(result)).toEqual(['a']);
    });

    it('stops with a warning when a batch adds nothing and the cursor does not move', async () => {
      const load = vi
        .fn<Load>()
        .mockResolvedValueOnce(batch(['a'], 1))
        .mockResolvedValueOnce(batch(['a'], 1));
      const {result} = renderHook(() => useInfiniteOptions<number>({load}));

      await callLoadMore(result);
      await callLoadMore(result);

      expect(result.current.hasMore).toBe(false);
      expect(warn).toHaveBeenCalledTimes(1);
    });

    it('replaces an earlier option with a later duplicate of it, keeping its place', async () => {
      const load = vi
        .fn<Load>()
        .mockResolvedValueOnce({nextCursor: 1, options: [{label: 'Old', value: 'a'}, 'b']})
        .mockResolvedValueOnce({nextCursor: 2, options: [{label: 'New', value: 'a'}]});
      const {result} = renderHook(() => useInfiniteOptions<number>({load}));

      await callLoadMore(result);
      await callLoadMore(result);

      expect(result.current.options).toEqual([
        {label: 'New', value: 'a'},
        {label: 'b', value: 'b'},
      ]);
    });
  });

  describe('plain list batches', () => {
    it('appends the list and keeps going while it adds options', async () => {
      const load = vi.fn<Load>().mockResolvedValueOnce(['a', 'b']).mockResolvedValueOnce(['c']);
      const {result} = renderHook(() => useInfiniteOptions({load}));

      await callLoadMore(result);
      await callLoadMore(result);

      expect(valuesOf(result)).toEqual(['a', 'b', 'c']);
      expect(result.current.hasMore).toBe(true);
    });

    it('lets a simple loader use the number of options loaded so far as its offset', async () => {
      const offsets: number[] = [];
      const load = vi.fn<Load>().mockImplementation(({options}) => {
        offsets.push(options.length);

        return Promise.resolve(options.length < 4 ? ['x', 'y'].map((value) => `${value}${options.length}`) : []);
      });
      const {result} = renderHook(() => useInfiniteOptions({load}));

      await callLoadMore(result);
      await callLoadMore(result);
      await callLoadMore(result);

      expect(offsets).toEqual([0, 2, 4]);
      expect(result.current.hasMore).toBe(false);
    });

    it.each([[[]], [['a']]])('finishes when a batch adds nothing new (%j)', async (second: string[]) => {
      const load = vi.fn<Load>().mockResolvedValueOnce(['a']).mockResolvedValueOnce(second);
      const {result} = renderHook(() => useInfiniteOptions({load}));

      await callLoadMore(result);
      await callLoadMore(result);

      expect(result.current.hasMore).toBe(false);
    });

    it.each([null, undefined])('treats %s as an empty batch without logging', async (nothing) => {
      const load = vi.fn<Load>().mockResolvedValue(nothing);
      const {result} = renderHook(() => useInfiniteOptions({load}));

      await callLoadMore(result);

      expect(result.current).toMatchObject({error: null, hasMore: false, options: []});
      expect(warn).not.toHaveBeenCalled();
    });

    it('treats a result that is not a list as empty and logs it once', async () => {
      const load = vi.fn<Load>().mockResolvedValue('oops' as never);
      const {result} = renderHook(() => useInfiniteOptions({load}));

      await callLoadMore(result);
      act(() => result.current.reset());
      await callLoadMore(result);

      expect(result.current.options).toEqual([]);
      expect(warn).toHaveBeenCalledTimes(1);
    });
  });

  describe('concurrency', () => {
    it('ignores a call while a load is running', async () => {
      let finish: (value: InfiniteOptionsBatch<number>) => void = () => undefined;
      const load = vi.fn<Load>().mockImplementation(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          }),
      );
      const {result} = renderHook(() => useInfiniteOptions<number>({load}));

      await callLoadMore(result);
      await callLoadMore(result);
      expect(result.current.loading).toBe(true);
      expect(load).toHaveBeenCalledTimes(1);

      await act(() => Promise.resolve(finish(batch(['a'], null))));

      expect(result.current.loading).toBe(false);
    });

    it('keeps the onLoadMore function the same across renders and loads', async () => {
      const load = vi.fn<Load>().mockResolvedValue(batch(['a'], 1));
      const {result, rerender} = renderHook(() => useInfiniteOptions<number>({load}));
      const original: () => void = result.current.onLoadMore;

      await callLoadMore(result);
      rerender();

      expect(result.current.onLoadMore).toBe(original);
    });

    it('calls the load function it was given most recently', async () => {
      const first = vi.fn<Load>().mockResolvedValue(batch(['first'], null));
      const second = vi.fn<Load>().mockResolvedValue(batch(['second'], null));
      const {result, rerender} = renderHook(({load}) => useInfiniteOptions<number>({load}), {
        initialProps: {load: first},
      });

      rerender({load: second});
      await callLoadMore(result);

      expect(first).not.toHaveBeenCalled();
      expect(valuesOf(result)).toEqual(['second']);
    });
  });

  describe('failures', () => {
    const failure: Error = new Error('boom');

    it('sets the error, calls onError, adds nothing and stops loading', async () => {
      const onError = vi.fn();
      const load = vi
        .fn<Load>()
        .mockResolvedValueOnce(batch(['a'], 1))
        .mockRejectedValueOnce(failure);
      const {result} = renderHook(() => useInfiniteOptions<number>({load, onError}));

      await callLoadMore(result);
      await callLoadMore(result);

      expect(result.current.error).toBe(failure);
      expect(onError).toHaveBeenCalledWith(failure);
      expect(valuesOf(result)).toEqual(['a']);
      expect(result.current.loading).toBe(false);
      expect(result.current.hasMore).toBe(true);
    });

    it('asks for the same cursor again after a failure, so no page is skipped', async () => {
      const load = vi
        .fn<Load>()
        .mockResolvedValueOnce(batch(['a'], 1))
        .mockRejectedValueOnce(failure)
        .mockResolvedValueOnce(batch(['b'], null));
      const {result} = renderHook(() => useInfiniteOptions<number>({load}));

      await callLoadMore(result);
      await callLoadMore(result);
      await callLoadMore(result);

      expect(load.mock.calls.map(([context]: [InfiniteOptionsLoadContext<number>]) => context.cursor)).toEqual([
        undefined,
        1,
        1,
      ]);
      expect(valuesOf(result)).toEqual(['a', 'b']);
    });

    it('clears the error after the next successful load', async () => {
      const load = vi
        .fn<Load>()
        .mockRejectedValueOnce(failure)
        .mockResolvedValueOnce(batch(['a'], null));
      const {result} = renderHook(() => useInfiniteOptions<number>({load}));

      await callLoadMore(result);
      expect(result.current.error).toBe(failure);
      await callLoadMore(result);

      expect(result.current.error).toBeNull();
    });

    it('wraps a thrown value that is not an Error', async () => {
      const onError = vi.fn();
      const load = vi.fn<Load>().mockRejectedValue('nope');
      const {result} = renderHook(() => useInfiniteOptions({load, onError}));

      await callLoadMore(result);

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('nope');
    });

    it('calls onError for every failure, not only the first', async () => {
      const onError = vi.fn();
      const load = vi.fn<Load>().mockRejectedValue(failure);
      const {result} = renderHook(() => useInfiniteOptions({load, onError}));

      await callLoadMore(result);
      await callLoadMore(result);

      expect(onError).toHaveBeenCalledTimes(2);
    });

    it('survives an onError callback that throws', async () => {
      const onError = vi.fn().mockImplementation(() => {
        throw new Error('callback bug');
      });
      const load = vi
        .fn<Load>()
        .mockRejectedValueOnce(failure)
        .mockResolvedValueOnce(batch(['a'], null));
      const {result} = renderHook(() => useInfiniteOptions<number>({load, onError}));

      await callLoadMore(result);
      await callLoadMore(result);

      expect(logError).toHaveBeenCalledTimes(1);
      expect(valuesOf(result)).toEqual(['a']);
    });

    it('does not report a failure that arrives after the list was reset', async () => {
      const onError = vi.fn();
      const rejecters: ((reason: Error) => void)[] = [];
      const load = vi.fn<Load>().mockImplementation(
        () =>
          new Promise((_, reject) => {
            rejecters.push(reject);
          }),
      );
      const {result} = renderHook(() => useInfiniteOptions<number>({load, onError}));

      await callLoadMore(result);
      await act(() => Promise.resolve(result.current.reset()));
      await act(() => Promise.resolve(rejecters[0](new Error('aborted'))));

      expect(onError).not.toHaveBeenCalled();
      expect(result.current.error).toBeNull();
    });
  });

  describe('reset', () => {
    it('goes back to the initial options and to a fresh cursor', async () => {
      const load = vi.fn<Load>().mockResolvedValue(batch(['a'], 1));
      const {result} = renderHook(() => useInfiniteOptions<number>({initialOptions: ['seed'], load}));
      await callLoadMore(result);

      act(() => {
        result.current.reset();
      });
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(load.mock.calls.at(-1)![0].cursor).toBeUndefined();
    });

    it('does not start a load when nothing had been requested before', () => {
      const load = vi.fn<Load>();
      const {result} = renderHook(() => useInfiniteOptions({initialOptions: ['seed'], load}));

      act(() => {
        result.current.reset();
      });

      expect(load).not.toHaveBeenCalled();
      expect(valuesOf(result)).toEqual(['seed']);
    });

    it('reloads from the start when loading had already begun', async () => {
      const load = vi.fn<Load>().mockResolvedValue(batch(['a'], 1));
      const {result} = renderHook(() => useInfiniteOptions<number>({load}));
      await callLoadMore(result);

      await act(() => Promise.resolve(result.current.reset()));

      expect(load).toHaveBeenCalledTimes(2);
      expect(load.mock.calls[1][0].cursor).toBeUndefined();
      expect(valuesOf(result)).toEqual(['a']);
    });

    it('reopens a list that had finished', async () => {
      const load = vi.fn<Load>().mockResolvedValue(batch(['a'], null));
      const {result} = renderHook(() => useInfiniteOptions<number>({load}));
      await callLoadMore(result);
      expect(result.current.hasMore).toBe(false);

      await act(() => Promise.resolve(result.current.reset()));

      expect(load).toHaveBeenCalledTimes(2);
    });

    it('aborts the running load and drops its result', async () => {
      let finish: (value: InfiniteOptionsBatch<number>) => void = () => undefined;
      const signals: AbortSignal[] = [];
      const load = vi.fn<Load>().mockImplementationOnce(
        ({signal}) =>
          new Promise((resolve) => {
            signals.push(signal);
            finish = resolve;
          }),
      );
      load.mockResolvedValue(batch(['fresh'], null));
      const {result} = renderHook(() => useInfiniteOptions<number>({load}));
      await callLoadMore(result);

      await act(() => Promise.resolve(result.current.reset()));
      await act(() => Promise.resolve(finish(batch(['stale'], 5))));

      expect(signals[0].aborted).toBe(true);
      expect(valuesOf(result)).toEqual(['fresh']);
    });
  });

  describe('unmount', () => {
    it('aborts the running load and does not report it as an error', async () => {
      const onError = vi.fn();
      const signals: AbortSignal[] = [];
      let fail: (reason: Error) => void = () => undefined;
      const load = vi.fn<Load>().mockImplementation(
        ({signal}) =>
          new Promise((_, reject) => {
            signals.push(signal);
            fail = reject;
          }),
      );
      const {result, unmount} = renderHook(() => useInfiniteOptions<number>({load, onError}));
      await callLoadMore(result);

      unmount();
      await act(() => Promise.resolve(fail(new Error('aborted'))));

      expect(signals[0].aborted).toBe(true);
      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe('first batch requested on mount', () => {
    const FirstBatch = ({load, onChange}: {load: Load; onChange: (result: UseInfiniteOptionsResult) => void}) => {
      const result = useInfiniteOptions<number>({load});
      const {onLoadMore} = result;

      onChange(result);
      useEffect(() => {
        onLoadMore();
      }, [onLoadMore]);

      return null;
    };

    it('loads the batch once', async () => {
      const load = vi.fn<Load>().mockResolvedValue(batch(['a', 'b'], null));
      let latest: UseInfiniteOptionsResult | undefined;

      render(<FirstBatch load={load} onChange={(result) => (latest = result)} />);

      await waitFor(() => expect(latest?.options).toHaveLength(2));
      expect(load).toHaveBeenCalledTimes(1);
      expect(latest?.loading).toBe(false);
    });

    // StrictMode runs the effects of a mounted component again after cleaning them up. The load started by the
    // first run is abandoned by that cleanup, so a later request must be able to start another one.
    it('still loads when the effects run again, as StrictMode does', async () => {
      const load = vi.fn<Load>().mockResolvedValue(batch(['a', 'b'], null));
      let latest: UseInfiniteOptionsResult | undefined;

      render(
        <StrictMode>
          <FirstBatch load={load} onChange={(result) => (latest = result)} />
        </StrictMode>,
      );

      await waitFor(() => expect(latest?.options).toHaveLength(2));
      expect(latest?.loading).toBe(false);
    });
  });
});
