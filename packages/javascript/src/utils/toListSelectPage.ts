// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import computeNextPageOffset from './computeNextPageOffset';
import toSelectOptions from './toSelectOptions';
import type {SelectPage} from '../models/select-page';
import type {SelectOption, SelectOptionDefaults, SelectOptionMapping} from '../models/select';

/**
 * Builds a loader page from one page of a management list response. The next offset comes from the
 * backend's own `count`, so items dropped by the mapping never shift the paging.
 */
const toListSelectPage = <T>(
  items: T[],
  {count, totalResults}: {count: number; totalResults: number},
  requestOffset: number,
  mapping?: SelectOptionMapping<T>,
  defaults?: SelectOptionDefaults,
): SelectPage & {options: SelectOption[]} => ({
  nextOffset: computeNextPageOffset(requestOffset, count, totalResults),
  options: toSelectOptions(items, mapping, defaults),
  totalResults,
});

export default toListSelectPage;
