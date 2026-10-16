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
import {onScopeDispose, ref, shallowRef, type Ref} from 'vue';

const logger: ReturnType<typeof createPackageComponentLogger> = createPackageComponentLogger(
  '@thunderid/vue',
  'useInfiniteOptions',
);

export interface UseInfiniteOptionsArgs<TCursor = unknown> {
  /** Options shown before anything is loaded, and again after `reset`. */
  initialOptions?: SelectOptionInput[];
  /** Loads the next batch. Returning nothing counts as an empty batch. Read on every call. */
  load: (context: SelectOptionsLoadContext<TCursor>) => Promise<SelectOptionsBatch<TCursor> | null | undefined>;
  /** Called with the error of every failed load. A failed load never changes the options. */
  onError?: (error: Error) => void;
}

export interface UseInfiniteOptionsResult {
  /** The error of the last load, cleared by the next successful one. */
  error: Ref<Error | null>;
  /** Whether more batches may be available. */
  hasMore: Ref<boolean>;
  loading: Ref<boolean>;
  /** Pass to `Select` as `onLoadMore` while `hasMore` is true, so its load more option is listed only while there is more to load. */
  onLoadMore: () => void;
  options: Ref<SelectOption[]>;
  /** Back to `initialOptions`; reloads right away if loading had already started. */
  reset: () => void;
}

/**
 * Keeps the option list of a `Select` that loads more options when the user asks for them. It owns the cursor,
 * appends each batch without duplicates, and stops at the end of the data. Vue counterpart of the React
 * `useInfiniteOptions`.
 *
 * `args` is read live, so a changing `load` or `onError` is picked up without passing refs.
 */
const useInfiniteOptions = <TCursor = unknown>(args: UseInfiniteOptionsArgs<TCursor>): UseInfiniteOptionsResult => {
  const options: Ref<SelectOption[]> = shallowRef(normalizeSelectOptions(args.initialOptions));
  const loading: Ref<boolean> = ref(false);
  const error: Ref<Error | null> = shallowRef(null);
  const hasMore: Ref<boolean> = ref(true);

  // Plain closure state, never read during render: it only coordinates loading.
  let cursor: TCursor | undefined;
  let finished = false;
  let inFlight = false;
  let requested = false;
  let generation = 0;
  let controller: AbortController | null = null;
  let nonListLogged = false;

  const applyBatch = (batch: SelectOptionsBatch<TCursor> | null | undefined): boolean => {
    const merged: OptionsMergeResult<TCursor> = mergeOptionsBatch({cursor, options: options.value}, batch);

    if (merged.issue === 'cursor-stuck') {
      logger.warn('A load returned no new options and the same cursor; the list was treated as finished.');
    } else if (merged.issue === 'not-a-list' && !nonListLogged) {
      nonListLogged = true;
      logger.warn('A load returned something other than a list of options; it was treated as an empty batch.');
    }

    const addedNothing: boolean = merged.options.length === options.value.length;

    cursor = merged.cursor;
    finished = merged.finished;
    options.value = merged.options;
    hasMore.value = !merged.finished;
    error.value = null;

    return addedNothing && !merged.finished;
  };

  const startLoad = async (): Promise<void> => {
    const startedGeneration: number = generation;
    const startedController: AbortController = new AbortController();

    controller = startedController;
    inFlight = true;
    loading.value = true;

    try {
      await loadUntilOptionsGrow<SelectOptionsBatch<TCursor> | null | undefined>(
        () => args.load({cursor, options: options.value, signal: startedController.signal}),
        applyBatch,
        () => startedGeneration === generation,
      );
    } catch (failure) {
      if (startedGeneration === generation && !startedController.signal.aborted) {
        const failureError: Error = toError(failure);

        error.value = failureError;
        try {
          args.onError?.(failureError);
        } catch (callbackFailure) {
          logger.error('The onError callback threw.', callbackFailure);
        }
      }
    } finally {
      if (startedGeneration === generation) {
        controller = null;
        inFlight = false;
        loading.value = false;
      }
    }
  };

  const onLoadMore = (): void => {
    if (inFlight || finished) {
      return;
    }

    requested = true;
    void startLoad();
  };

  const reset = (): void => {
    const shouldReload: boolean = requested;

    generation += 1;
    controller?.abort();
    controller = null;
    cursor = undefined;
    finished = false;
    inFlight = false;
    options.value = normalizeSelectOptions(args.initialOptions);
    hasMore.value = true;
    error.value = null;
    loading.value = false;

    if (shouldReload) {
      void startLoad();
    }
  };

  onScopeDispose(() => {
    generation += 1;
    controller?.abort();
  });

  return {error, hasMore, loading, onLoadMore, options, reset};
};

export default useInfiniteOptions;
