// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {MutableRefObject, useCallback, useEffect, useRef, useState} from 'react';
import toError from './toError';
import useLatest from './useLatest';

// The playground's own data layer for the SDK's management API functions. An app would use TanStack
// Query, SWR, or its own store; this is the smallest stand-in that gives the cards a
// {data, error, isLoading, refetch} result for a call such as
// `getGroups({...useManagementRequestConfig('groups'), limit: 5})`.

export interface ApiQuery<T> {
  data: T | undefined;
  error: Error | null;
  isLoading: boolean;
  /** Runs the request now, also while disabled. Resolves with the data, or undefined when it failed. */
  refetch: () => Promise<T | undefined>;
}

export interface ApiQueryOptions {
  /** Runs the request on mount and whenever `key` changes. Defaults to true. */
  enabled?: boolean;
  /** What the request is for, such as an ID; a change runs it again while enabled. */
  key?: string;
}

/** Runs `request` and keeps its result. Only the response to the latest run is kept. */
const useApiQuery = <T>(request: () => Promise<T>, {enabled = true, key = ''}: ApiQueryOptions = {}): ApiQuery<T> => {
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const latest: MutableRefObject<() => Promise<T>> = useLatest(request);
  const runs: MutableRefObject<number> = useRef<number>(0);

  const refetch: () => Promise<T | undefined> = useCallback(async (): Promise<T | undefined> => {
    runs.current += 1;
    const run: number = runs.current;

    setIsLoading(true);

    try {
      const result: T = await latest.current();

      if (run === runs.current) {
        setData(result);
        setError(null);
      }

      return result;
    } catch (caught) {
      if (run === runs.current) setError(toError(caught));

      return undefined;
    } finally {
      if (run === runs.current) setIsLoading(false);
    }
  }, [latest]);

  useEffect(() => {
    if (enabled) refetch().catch(() => undefined);
  }, [enabled, key, refetch]);

  return {data, error, isLoading, refetch};
};

export default useApiQuery;
