// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

'use client';

import {MutableRefObject, useCallback, useState} from 'react';
import toError from './toError';
import useLatest from './useLatest';

export interface ApiMutation<V, T> {
  data: T | undefined;
  error: Error | null;
  isLoading: boolean;
  /** Runs the request and ignores a failure, which stays in `error`. */
  mutate: (variables: V) => void;
  /** Runs the request; rejects when it fails. */
  mutateAsync: (variables: V) => Promise<T>;
}

export interface ApiMutationOptions<T> {
  onError?: (error: Error) => void;
  onSuccess?: (data: T) => void;
}

/** Runs `request` on demand, such as a create or delete, and keeps the state of the last run. */
const useApiMutation = <V, T>(
  request: (variables: V) => Promise<T>,
  options: ApiMutationOptions<T> = {},
): ApiMutation<V, T> => {
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const latest: MutableRefObject<(variables: V) => Promise<T>> = useLatest(request);
  const callbacks: MutableRefObject<ApiMutationOptions<T>> = useLatest(options);

  const mutateAsync: (variables: V) => Promise<T> = useCallback(
    async (variables: V): Promise<T> => {
      setIsLoading(true);
      setError(null);

      try {
        const result: T = await latest.current(variables);

        setData(result);
        callbacks.current.onSuccess?.(result);

        return result;
      } catch (caught) {
        const failure: Error = toError(caught);

        setError(failure);
        callbacks.current.onError?.(failure);
        throw failure;
      } finally {
        setIsLoading(false);
      }
    },
    [callbacks, latest],
  );

  const mutate: (variables: V) => void = useCallback(
    (variables: V): void => {
      mutateAsync(variables).catch(() => undefined);
    },
    [mutateAsync],
  );

  return {data, error, isLoading, mutate, mutateAsync};
};

export default useApiMutation;
