// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import type {SelectOption} from '../models/select';

/**
 * Appends `incoming` to `existing`, keeping each value at its first position and taking the newest
 * data when a value repeats (offset paging can return the same item on two pages).
 *
 * @internal Shared by the SDK packages. It is not part of the public API and can change in any release.
 */
const dedupeSelectOptions = (existing: SelectOption[], incoming: SelectOption[]): SelectOption[] => {
  const merged: SelectOption[] = [...existing];
  const indexByValue = new Map<string, number>(merged.map((option, index) => [option.value, index]));

  incoming.forEach((option: SelectOption) => {
    const existingIndex: number | undefined = indexByValue.get(option.value);

    if (existingIndex === undefined) {
      indexByValue.set(option.value, merged.length);
      merged.push(option);
    } else {
      merged[existingIndex] = option;
    }
  });

  return merged;
};

export default dedupeSelectOptions;
