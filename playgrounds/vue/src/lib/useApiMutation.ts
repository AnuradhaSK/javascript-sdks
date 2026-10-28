// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {Ref, ref, shallowRef, ShallowRef} from 'vue';
import toError from './toError';

export interface ApiMutation<V, T> {
  data: ShallowRef<T | undefined>;
  error: Ref<Error | null>;
  isLoading: Ref<boolean>;
  /** Runs the request; rejects when it fails. */
  mutateAsync: (variables: V) => Promise<T>;
}

export interface ApiMutationOptions<T> {
  onError?: (error: Error) => void;
  onSuccess?: (data: T) => unknown;
}

/** Runs `request` on demand, such as a create or delete, and keeps the state of the last run. */
const useApiMutation = <V, T>(
  request: (variables: V) => Promise<T>,
  options: ApiMutationOptions<T> = {},
): ApiMutation<V, T> => {
  const data: ShallowRef<T | undefined> = shallowRef<T | undefined>(undefined);
  const error: Ref<Error | null> = ref<Error | null>(null);
  const isLoading: Ref<boolean> = ref<boolean>(false);

  const mutateAsync = async (variables: V): Promise<T> => {
    isLoading.value = true;
    error.value = null;

    try {
      const result: T = await request(variables);

      data.value = result;
      await options.onSuccess?.(result);

      return result;
    } catch (caught) {
      const failure: Error = toError(caught);

      error.value = failure;
      options.onError?.(failure);
      throw failure;
    } finally {
      isLoading.value = false;
    }
  };

  return {data, error, isLoading, mutateAsync};
};

export default useApiMutation;
