// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import type {SelectOptionsBatch, SelectOptionsLoadContext} from '@thunderid/browser';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {effectScope, type EffectScope} from 'vue';
import useInfiniteOptions, {type UseInfiniteOptionsResult} from '../../composables/useInfiniteOptions';

const warn = vi.hoisted(() => vi.fn());
const logError = vi.hoisted(() => vi.fn());

vi.mock('@thunderid/browser', async (importOriginal: () => Promise<Record<string, unknown>>) => ({
  ...(await importOriginal()),
  createPackageComponentLogger: () => ({debug: vi.fn(), error: logError, info: vi.fn(), warn}),
}));

type Load = (context: SelectOptionsLoadContext<number>) => Promise<SelectOptionsBatch<number> | null | undefined>;

const batch = (values: string[], nextCursor?: number | null): SelectOptionsBatch<number> => ({
  nextCursor,
  options: values,
});

const scopes: EffectScope[] = [];
const setup = (args: {
  initialOptions?: string[];
  load: Load;
  onError?: (error: Error) => void;
}): UseInfiniteOptionsResult => {
  const scope: EffectScope = effectScope();
  scopes.push(scope);

  return scope.run(() => useInfiniteOptions<number>(args))!;
};

const valuesOf = (result: UseInfiniteOptionsResult): string[] => result.options.value.map((option) => option.value);

const callLoadMore = async (result: UseInfiniteOptionsResult): Promise<void> => {
  result.onLoadMore();
  await vi.waitFor(() => expect(result.loading.value).toBe(false));
};

describe('useInfiniteOptions (vue)', () => {
  afterEach(() => {
    scopes.splice(0).forEach((scope) => scope.stop());
    warn.mockClear();
    logError.mockClear();
  });

  describe('initial state', () => {
    it('starts with the initial options, idle and with more to load, and loads nothing by itself', () => {
      const load = vi.fn<Load>();

      const result = setup({initialOptions: ['A'], load});

      expect(valuesOf(result)).toEqual(['A']);
      expect(result.error.value).toBeNull();
      expect(result.hasMore.value).toBe(true);
      expect(result.loading.value).toBe(false);
      expect(load).not.toHaveBeenCalled();
    });
  });

  describe('cursor batches', () => {
    it('passes no cursor first, then the cursor of the previous batch, with the options loaded so far', async () => {
      const load = vi
        .fn<Load>()
        .mockResolvedValueOnce(batch(['a', 'b'], 2))
        .mockResolvedValueOnce(batch(['c'], null));
      const result = setup({load});

      await callLoadMore(result);
      await callLoadMore(result);

      const [first, second] = load.mock.calls.map(([context]) => context);
      expect(first.cursor).toBeUndefined();
      expect(second.cursor).toBe(2);
      expect(second.options.map((option) => option.value)).toEqual(['a', 'b']);
      expect(first.signal).toBeInstanceOf(AbortSignal);
      expect(valuesOf(result)).toEqual(['a', 'b', 'c']);
    });

    it('stops when the cursor is null and ignores later calls', async () => {
      const load = vi.fn<Load>().mockResolvedValue(batch(['a'], null));
      const result = setup({load});

      await callLoadMore(result);
      result.onLoadMore();

      expect(result.hasMore.value).toBe(false);
      expect(load).toHaveBeenCalledTimes(1);
    });

    it('keeps going by itself when a batch holds only duplicates but the cursor advances', async () => {
      const load = vi
        .fn<Load>()
        .mockResolvedValueOnce(batch(['a'], 1))
        .mockResolvedValueOnce(batch(['a'], 2))
        .mockResolvedValueOnce(batch(['b'], null));
      const result = setup({load});

      await callLoadMore(result);
      await callLoadMore(result);

      expect(load).toHaveBeenCalledTimes(3);
      expect(valuesOf(result)).toEqual(['a', 'b']);
      expect(result.hasMore.value).toBe(false);
    });

    it('keeps going through pages that add nothing, but only a few in a row', async () => {
      let cursor = 0;
      const load = vi.fn<Load>().mockImplementation(() => {
        cursor += 1;

        return Promise.resolve(batch([], cursor));
      });
      const result = setup({load});

      await callLoadMore(result);

      expect(load).toHaveBeenCalledTimes(4);
      expect(result.hasMore.value).toBe(true);
    });

    it('stops with a warning when a batch adds nothing and the cursor does not move', async () => {
      const load = vi
        .fn<Load>()
        .mockResolvedValueOnce(batch(['a'], 1))
        .mockResolvedValueOnce(batch(['a'], 1));
      const result = setup({load});

      await callLoadMore(result);
      await callLoadMore(result);

      expect(result.hasMore.value).toBe(false);
      expect(warn).toHaveBeenCalledTimes(1);
    });
  });

  describe('plain list batches', () => {
    it('appends the list and finishes when a batch adds nothing new', async () => {
      const load = vi.fn<Load>().mockResolvedValueOnce(['a', 'b']).mockResolvedValueOnce(['b']);
      const result = setup({load});

      await callLoadMore(result);
      expect(result.hasMore.value).toBe(true);
      await callLoadMore(result);

      expect(valuesOf(result)).toEqual(['a', 'b']);
      expect(result.hasMore.value).toBe(false);
    });

    it.each([null, undefined])('treats %s as an empty batch without logging', async (nothing) => {
      const result = setup({load: vi.fn<Load>().mockResolvedValue(nothing)});

      await callLoadMore(result);

      expect(result.hasMore.value).toBe(false);
      expect(warn).not.toHaveBeenCalled();
    });

    it('treats a result that is not a list as empty and logs it once', async () => {
      const result = setup({load: vi.fn<Load>().mockResolvedValue('oops' as never)});

      await callLoadMore(result);
      result.reset();
      await callLoadMore(result);

      expect(warn).toHaveBeenCalledTimes(1);
    });
  });

  describe('concurrency', () => {
    it('ignores a call while a load is running', async () => {
      let finish: (value: SelectOptionsBatch<number>) => void = () => undefined;
      const load = vi.fn<Load>().mockImplementation(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          }),
      );
      const result = setup({load});

      result.onLoadMore();
      result.onLoadMore();
      expect(result.loading.value).toBe(true);
      expect(load).toHaveBeenCalledTimes(1);

      finish(batch(['a'], null));
      await vi.waitFor(() => expect(result.loading.value).toBe(false));
    });

    it('calls the load function of the args it was given, read on every call', async () => {
      const args = {load: vi.fn<Load>().mockResolvedValue(batch(['first'], null))};
      const second = vi.fn<Load>().mockResolvedValue(batch(['second'], null));
      const result = setup(args);

      args.load = second;
      await callLoadMore(result);

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
      const result = setup({load, onError});

      await callLoadMore(result);
      await callLoadMore(result);

      expect(result.error.value).toBe(failure);
      expect(onError).toHaveBeenCalledWith(failure);
      expect(valuesOf(result)).toEqual(['a']);
      expect(result.hasMore.value).toBe(true);
    });

    it('asks for the same cursor again after a failure, so no page is skipped', async () => {
      const load = vi
        .fn<Load>()
        .mockResolvedValueOnce(batch(['a'], 1))
        .mockRejectedValueOnce(failure)
        .mockResolvedValueOnce(batch(['b'], null));
      const result = setup({load});

      await callLoadMore(result);
      await callLoadMore(result);
      await callLoadMore(result);

      expect(load.mock.calls.map(([context]) => context.cursor)).toEqual([undefined, 1, 1]);
      expect(valuesOf(result)).toEqual(['a', 'b']);
      expect(result.error.value).toBeNull();
    });

    it('wraps a thrown value that is not an Error', async () => {
      const result = setup({load: vi.fn<Load>().mockRejectedValue('nope')});

      await callLoadMore(result);

      expect(result.error.value).toBeInstanceOf(Error);
      expect(result.error.value?.message).toBe('nope');
    });

    it('survives an onError callback that throws', async () => {
      const onError = vi.fn().mockImplementation(() => {
        throw new Error('callback bug');
      });
      const load = vi
        .fn<Load>()
        .mockRejectedValueOnce(failure)
        .mockResolvedValueOnce(batch(['a'], null));
      const result = setup({load, onError});

      await callLoadMore(result);
      await callLoadMore(result);

      expect(logError).toHaveBeenCalledTimes(1);
      expect(valuesOf(result)).toEqual(['a']);
    });
  });

  describe('reset', () => {
    it('goes back to the initial options and a fresh cursor, and reloads when loading had begun', async () => {
      const load = vi.fn<Load>().mockResolvedValue(batch(['a'], 1));
      const result = setup({initialOptions: ['seed'], load});
      await callLoadMore(result);

      result.reset();
      await vi.waitFor(() => expect(load).toHaveBeenCalledTimes(2));

      expect(load.mock.calls[1][0].cursor).toBeUndefined();
    });

    it('does not start a load when nothing had been requested before', () => {
      const load = vi.fn<Load>();
      const result = setup({initialOptions: ['seed'], load});

      result.reset();

      expect(load).not.toHaveBeenCalled();
      expect(valuesOf(result)).toEqual(['seed']);
    });

    it('aborts the running load and drops its result and its failure', async () => {
      const onError = vi.fn();
      const signals: AbortSignal[] = [];
      const finishers: ((value: SelectOptionsBatch<number>) => void)[] = [];
      const load = vi.fn<Load>().mockImplementationOnce(
        ({signal}) =>
          new Promise((resolve) => {
            signals.push(signal);
            finishers.push(resolve);
          }),
      );
      load.mockResolvedValue(batch(['fresh'], null));
      const result = setup({load, onError});
      result.onLoadMore();

      result.reset();
      finishers[0](batch(['stale'], 5));
      await vi.waitFor(() => expect(result.loading.value).toBe(false));

      expect(signals[0].aborted).toBe(true);
      expect(valuesOf(result)).toEqual(['fresh']);
      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe('scope disposal', () => {
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
      const scope: EffectScope = effectScope();
      const result = scope.run(() => useInfiniteOptions<number>({load, onError}))!;
      result.onLoadMore();

      scope.stop();
      fail(new Error('aborted'));
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 20);
      });

      expect(signals[0].aborted).toBe(true);
      expect(onError).not.toHaveBeenCalled();
    });
  });
});
