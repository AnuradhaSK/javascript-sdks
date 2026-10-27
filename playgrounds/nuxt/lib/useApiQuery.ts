// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ref, shallowRef, watch, type Ref, type ShallowRef} from 'vue';
import toError from './toError';

// The playground's own data layer for the SDK's management API functions. An app would use TanStack
// Query, Pinia Colada, or its own store; this is the smallest stand-in that gives the cards a
// {data, error, isLoading, refetch} result for a call such as
// `getGroups({...useManagementRequestConfig('groups'), limit: 5})`.

export interface ApiQuery<T> {
  data: ShallowRef<T | undefined>;
  error: Ref<Error | null>;
  isLoading: Ref<boolean>;
  /** Runs the request now, also while disabled. Resolves with the data, or undefined when it failed. */
  refetch: () => Promise<T | undefined>;
}

export interface ApiQueryOptions {
  /** Runs the request when it turns true, and again whenever `key` changes. Defaults to always. */
  enabled?: () => boolean;
  /** What the request is for, such as an ID read from another query. */
  key?: () => unknown;
}

/** Runs `request` and keeps its result. Only the response to the latest run is kept. */
const useApiQuery = <T>(request: () => Promise<T>, options: ApiQueryOptions = {}): ApiQuery<T> => {
  const data: ShallowRef<T | undefined> = shallowRef<T | undefined>(undefined);
  const error: Ref<Error | null> = ref<Error | null>(null);
  const isLoading: Ref<boolean> = ref<boolean>(false);
  let runs = 0;

  const refetch = async (): Promise<T | undefined> => {
    runs += 1;
    const run: number = runs;

    isLoading.value = true;

    try {
      const result: T = await request();

      if (run === runs) {
        data.value = result;
        error.value = null;
      }

      return result;
    } catch (caught) {
      if (run === runs) error.value = toError(caught);

      return undefined;
    } finally {
      if (run === runs) isLoading.value = false;
    }
  };

  watch(
    () => [options.enabled?.() ?? true, options.key?.()],
    ([enabled]: unknown[]) => {
      if (enabled) refetch().catch(() => undefined);
    },
    {immediate: true},
  );

  return {data, error, isLoading, refetch};
};

export default useApiQuery;
