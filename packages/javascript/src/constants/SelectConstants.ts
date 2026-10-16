// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

/**
 * Limits and values shared by the select pickers that list management resources.
 */
const SelectConstants: {
  DEFAULT_PAGE_SIZE: number;
  LOAD_MORE_OPTION_VALUE: string;
  MAX_EMPTY_CONTINUATIONS: number;
  MAX_FILTER_LENGTH: number;
  MAX_PAGE_SIZE: number;
} = {
  /** How many options a picker asks for at a time when it is not told otherwise. */
  DEFAULT_PAGE_SIZE: 30,

  /**
   * Value of the option, listed after the last one, that asks for more options. It is never submitted: choosing it
   * loads more and leaves the selection as it was.
   */
  LOAD_MORE_OPTION_VALUE: '__load_more__',

  /**
   * Batches in a row that add nothing new before the loading helper stops continuing by itself and waits for the
   * next call.
   */
  MAX_EMPTY_CONTINUATIONS: 3,

  /** The longest `filter` expression a browser may send to a server route; the directory takes one equality expression. */
  MAX_FILTER_LENGTH: 512,

  /**
   * The largest page the management API serves. The flow list clamps a larger request and the user
   * type list rejects it, so loaders cap their request at this size.
   */
  MAX_PAGE_SIZE: 100,
};

export default SelectConstants;
