// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import SelectConstants from '../constants/SelectConstants';
import type {SelectPageQueryResult} from '../models/select-page';

const DIGITS = /^\d+$/;

/** A whole number of zero or more, given as a number or as digits in a string, as a URL query gives it. */
const isWholeNumber = (raw: unknown): boolean =>
  (typeof raw === 'number' && Number.isSafeInteger(raw) && raw >= 0) ||
  (typeof raw === 'string' && DIGITS.test(raw) && Number.isSafeInteger(Number(raw)));

/**
 * Checks the values a browser sends to a server route or server action that loads one page of a management
 * resource. The browser is not trusted: `limit` and `offset` must be whole numbers, and `filter`, only read when
 * `allowFilter` is set, must be a string of reasonable length. Anything else names the first parameter that is
 * not acceptable.
 *
 * @internal Shared by the SDK packages. It is not part of the public API and can change in any release.
 */
const parseSelectPageQuery = (
  raw: {filter?: unknown; limit?: unknown; offset?: unknown},
  {allowFilter = false}: {allowFilter?: boolean} = {},
): SelectPageQueryResult => {
  if (raw.limit !== undefined && !isWholeNumber(raw.limit)) {
    return {invalid: 'limit'};
  }

  if (raw.offset !== undefined && !isWholeNumber(raw.offset)) {
    return {invalid: 'offset'};
  }

  if (
    allowFilter &&
    raw.filter !== undefined &&
    (typeof raw.filter !== 'string' || raw.filter.length > SelectConstants.MAX_FILTER_LENGTH)
  ) {
    return {invalid: 'filter'};
  }

  return {
    query: {
      filter: allowFilter && typeof raw.filter === 'string' && raw.filter !== '' ? raw.filter : undefined,
      limit: raw.limit === undefined ? undefined : Number(raw.limit),
      offset: raw.offset === undefined ? undefined : Number(raw.offset),
    },
  };
};

export default parseSelectPageQuery;
