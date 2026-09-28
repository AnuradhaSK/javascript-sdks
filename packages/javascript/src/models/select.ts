// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

/**
 * A selectable option: `label` is shown, `value` is submitted.
 */
export interface SelectOption {
  disabled?: boolean;
  label: string;
  value: string;
}

/**
 * An option as callers write it: a string or number stands for itself, an object sets label and value.
 */
export type SelectOptionInput = string | number | SelectOption;

/**
 * One batch of options from a loader. A plain list ends the data when it is empty or adds nothing new; the
 * object form ends it when `nextCursor` is missing.
 */
export type SelectOptionsBatch<TCursor = unknown> =
  | SelectOptionInput[]
  | {nextCursor?: TCursor | null; options: SelectOptionInput[]};

/**
 * What a loader receives when its select asks for more options.
 */
export interface SelectOptionsLoadContext<TCursor = unknown> {
  /** `undefined` on the first call, then the `nextCursor` of the previous batch. */
  cursor: TCursor | undefined;
  /** The options loaded so far. */
  options: readonly SelectOption[];
  /** Aborted when the list is reset or its owner is destroyed. */
  signal: AbortSignal;
}

/**
 * Chooses which field of each raw item is the label and which is the value.
 *
 * A field is a key of the item, or a dotted path into it (`'name.given'`); keys inside an
 * `attributes` object are found too. Plain strings and numbers need no mapping.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- the item shape belongs to the consumer's loader
export interface SelectOptionMapping<T = any> {
  getLabel?: (item: T) => string | undefined;
  getValue?: (item: T) => string | undefined;
  /** Fields tried in order for the label; the first non-empty one that is not the item's `id` wins. */
  labelAttributes?: string[];
  /** Field submitted as the value. When set, items without it are left out. */
  valueAttribute?: string;
}

/**
 * What a specialised picker (users, emails, ...) assumes about its items when none is configured.
 */
export interface SelectOptionDefaults {
  /** Label fields tried for items that have an `id`. */
  labelAttributes?: readonly string[];
}

/** The wording a `Select` shows for its own states. */
export interface SelectMessages {
  /** Label of the option that asks for the next batch of options. */
  loadMore: string;
  /** Shown while the first options are being fetched. */
  loading: string;
  /** Label of the load more option, and the status text, while a batch is being fetched. */
  loadingMore: string;
}
