// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {
  createPackageComponentLogger,
  loadUntilOptionsGrow,
  mergeOptionsBatch,
  normalizeSelectOptions,
  toError,
} from '@thunderid/browser';
import type {
  OptionsMergeResult,
  SelectOption,
  SelectOptionInput,
  SelectOptionsBatch,
  SelectOptionsLoadContext,
} from '@thunderid/browser';
import {useCallback, useEffect, useRef, useState} from 'react';

const logger: ReturnType<typeof createPackageComponentLogger> = createPackageComponentLogger(
  '@thunderid/react',
  'useInfiniteOptions',
);

export type InfiniteOptionsLoadContext<TCursor = unknown> = SelectOptionsLoadContext<TCursor>;

export type InfiniteOptionsBatch<TCursor = unknown> = SelectOptionsBatch<TCursor>;

export interface UseInfiniteOptionsArgs<TCursor = unknown> {
  /** Options shown before anything is loaded, and again after {@link UseInfiniteOptionsResult.reset}. */
  initialOptions?: SelectOptionInput[];
  /** Loads the next batch. Returning nothing counts as an empty batch. */
  load: (context: InfiniteOptionsLoadContext<TCursor>) => Promise<InfiniteOptionsBatch<TCursor> | null | undefined>;
  /** Called with the error of every failed load. A failed load never changes the options. */
  onError?: (error: Error) => void;
}

export interface UseInfiniteOptionsResult {
  /** The error of the last load, cleared by the next successful one. */
  error: Error | null;
  /** Whether more batches may be available. */
  hasMore: boolean;
  loading: boolean;
  /** Pass to `Select` while `hasMore` is true, so its load more option is listed only while there is more to load. Its identity is stable across renders. */
  onLoadMore: () => void;
  options: SelectOption[];
  /** Back to `initialOptions`; reloads right away if loading had already started. */
  reset: () => void;
}

/**
 * Keeps the option list of a `Select` that loads more options when the user asks for them. It owns the cursor,
 * appends each batch without duplicates, and stops at the end of the data. Nothing is rendered, so it works with
 * any list component.
 */
const useInfiniteOptions = <TCursor = unknown>({
  initialOptions,
  load,
  onError,
}: UseInfiniteOptionsArgs<TCursor>): UseInfiniteOptionsResult => {
  const [options, setOptions] = useState<SelectOption[]>(() => normalizeSelectOptions(initialOptions));
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);

  const latest = useRef({initialOptions, load, onError});
  const optionsRef = useRef<SelectOption[]>(options);
  const cursorRef = useRef<TCursor | undefined>(undefined);
  const finishedRef = useRef<boolean>(false);
  const loadingRef = useRef<boolean>(false);
  const requestedRef = useRef<boolean>(false);
  const generationRef = useRef<number>(0);
  const controllerRef = useRef<AbortController | null>(null);
  const nonListLoggedRef = useRef<boolean>(false);

  useEffect(() => {
    latest.current = {initialOptions, load, onError};
  });

  const applyBatch = useCallback((batch: SelectOptionsBatch<TCursor> | null | undefined): boolean => {
    const merged: OptionsMergeResult<TCursor> = mergeOptionsBatch(
      {cursor: cursorRef.current, options: optionsRef.current},
      batch,
    );

    if (merged.issue === 'cursor-stuck') {
      logger.warn('A load returned no new options and the same cursor; the list was treated as finished.');
    } else if (merged.issue === 'not-a-list' && !nonListLoggedRef.current) {
      nonListLoggedRef.current = true;
      logger.warn('A load returned something other than a list of options; it was treated as an empty batch.');
    }

    const addedNothing: boolean = merged.options.length === optionsRef.current.length;

    cursorRef.current = merged.cursor;
    optionsRef.current = merged.options;
    finishedRef.current = merged.finished;
    setOptions(merged.options);
    setHasMore(!merged.finished);
    setError(null);

    return addedNothing && !merged.finished;
  }, []);

  const startLoad = useCallback(async (): Promise<void> => {
    const generation: number = generationRef.current;
    const controller: AbortController = new AbortController();

    controllerRef.current = controller;
    loadingRef.current = true;
    setLoading(true);

    try {
      await loadUntilOptionsGrow<SelectOptionsBatch<TCursor> | null | undefined>(
        () =>
          latest.current.load({
            cursor: cursorRef.current,
            options: optionsRef.current,
            signal: controller.signal,
          }),
        applyBatch,
        () => generation === generationRef.current,
      );
    } catch (failure) {
      if (generation === generationRef.current && !controller.signal.aborted) {
        const failureError: Error = toError(failure);

        setError(failureError);
        try {
          latest.current.onError?.(failureError);
        } catch (callbackFailure) {
          logger.error('The onError callback threw.', callbackFailure);
        }
      }
    } finally {
      if (generation === generationRef.current) {
        controllerRef.current = null;
        loadingRef.current = false;
        setLoading(false);
      }
    }
  }, [applyBatch]);

  const onLoadMore = useCallback((): void => {
    if (loadingRef.current || finishedRef.current) {
      return;
    }

    requestedRef.current = true;
    void startLoad();
  }, [startLoad]);

  const reset = useCallback((): void => {
    const shouldReload: boolean = requestedRef.current;
    const initial: SelectOption[] = normalizeSelectOptions(latest.current.initialOptions);

    generationRef.current += 1;
    controllerRef.current?.abort();
    controllerRef.current = null;
    cursorRef.current = undefined;
    finishedRef.current = false;
    loadingRef.current = false;
    optionsRef.current = initial;
    setOptions(initial);
    setHasMore(true);
    setError(null);
    setLoading(false);

    if (shouldReload) {
      void startLoad();
    }
  }, [startLoad]);

  // Cleaning up abandons the running load, so the helper must not go on treating it as in progress. React
  // runs a component's effects again after cleaning them up, and that second run needs to be able to load.
  useEffect(
    () => () => {
      generationRef.current += 1;
      controllerRef.current?.abort();
      controllerRef.current = null;
      loadingRef.current = false;
      setLoading(false);
    },
    [],
  );

  return {error, hasMore, loading, onLoadMore, options, reset};
};

export default useInfiniteOptions;
