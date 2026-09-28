// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import dedupeSelectOptions from './dedupeSelectOptions';
import normalizeSelectOptions from './normalizeSelectOptions';
import type {SelectOption, SelectOptionsBatch} from '../models/select';

export interface OptionsMergeState<TCursor = unknown> {
  cursor: TCursor | undefined;
  options: readonly SelectOption[];
}

export type OptionsBatchIssue = 'cursor-stuck' | 'not-a-list';

export interface OptionsMergeResult<TCursor = unknown> {
  cursor: TCursor | undefined;
  /** No more batches should be requested. */
  finished: boolean;
  /** Something about the batch the caller may want to log. The merge itself carried on. */
  issue?: OptionsBatchIssue;
  options: SelectOption[];
}

/**
 * Adds one loaded batch to the options loaded so far and decides whether the data has ended. Options that are
 * already present are replaced in place by their newer copy. A batch with a cursor ends when the cursor is
 * missing, or when it adds nothing and the cursor did not move (a loader that ignores its cursor). A plain list
 * ends when it adds nothing new. `null`, `undefined` and anything that is not a list count as an empty batch.
 *
 * @internal Shared by the SDK packages. It is not part of the public API and can change in any release.
 */
const mergeOptionsBatch = <TCursor = unknown>(
  {cursor, options}: OptionsMergeState<TCursor>,
  batch: SelectOptionsBatch<TCursor> | null | undefined,
): OptionsMergeResult<TCursor> => {
  const hasCursorForm: boolean = typeof batch === 'object' && batch !== null && !Array.isArray(batch);
  const rawOptions: unknown = hasCursorForm ? (batch as {options?: unknown}).options : batch;
  const isList: boolean = Array.isArray(rawOptions);
  const merged: SelectOption[] = dedupeSelectOptions(
    [...options],
    normalizeSelectOptions(isList ? (rawOptions as SelectOption[]) : []),
  );
  const addedNothing: boolean = merged.length === options.length;
  const notAList: boolean = rawOptions !== null && rawOptions !== undefined && !isList;

  if (!hasCursorForm) {
    return {cursor, finished: addedNothing, ...(notAList ? {issue: 'not-a-list' as const} : {}), options: merged};
  }

  const {nextCursor} = batch as {nextCursor?: TCursor | null};
  const cursorStuck: boolean = addedNothing && nextCursor === cursor;
  let issue: OptionsBatchIssue | undefined;

  if (notAList) {
    issue = 'not-a-list';
  } else if (cursorStuck) {
    issue = 'cursor-stuck';
  }

  return {
    cursor: nextCursor ?? undefined,
    finished: nextCursor === null || nextCursor === undefined || cursorStuck,
    ...(issue ? {issue} : {}),
    options: merged,
  };
};

export default mergeOptionsBatch;
