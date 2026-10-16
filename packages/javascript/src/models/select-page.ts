// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import type {EmbeddedFlowComponent} from './embedded-flow';
import type {SelectOption} from './select';

/**
 * One page request sent to a {@link FetchSelectPage} loader.
 */
export interface SelectPageRequest {
  component: EmbeddedFlowComponent;
  filter?: string;
  limit: number;
  offset: number;
  signal: AbortSignal;
}

/**
 * One page returned by a loader. Return ready-made `options`, or raw `items` for the picker to
 * convert with its `mapping`. `nextOffset` is `null` on the last page, otherwise it must be greater
 * than the request's `offset`.
 */
export interface SelectPage {
  items?: unknown[];
  nextOffset: number | null;
  options?: SelectOption[];
  totalResults?: number;
}

export type FetchSelectPage = (request: SelectPageRequest) => Promise<SelectPage>;

/** The paging values, and optional filter, a browser may send to a server route that loads one page. */
export interface SelectPageQuery {
  filter?: string;
  limit?: number;
  offset?: number;
}

/** The checked query, or the name of the first parameter that was not acceptable. */
export type SelectPageQueryResult =
  | {invalid?: undefined; query: SelectPageQuery}
  | {invalid: 'filter' | 'limit' | 'offset'};
