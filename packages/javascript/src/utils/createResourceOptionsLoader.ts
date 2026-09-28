// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import isAdvancingPageOffset from './isAdvancingPageOffset';
import loadPageWithRetryAndLog from './loadPageWithRetryAndLog';
import {createResourceFailureLogger, type ResourceFailureLogger} from './logResourceFailure';
import toSelectOptions from './toSelectOptions';
import type {EmbeddedFlowComponent} from '../models/embedded-flow';
import type {FetchSelectPage, SelectPage} from '../models/select-page';
import type {SelectOption, SelectOptionDefaults, SelectOptionMapping} from '../models/select';

export interface ResourceOptionsLoaderConfig {
  /** The flow component the requests are made for. */
  component: EmbeddedFlowComponent;
  defaults?: SelectOptionDefaults;
  fetchPage: FetchSelectPage;
  filter?: string;
  mapping?: SelectOptionMapping;
  pageSize: number;
  /** What is being loaded, such as `users`. Named in the failure log. */
  resource: string;
}

export interface ResourceOptionsLoadContext {
  /** The offset to continue from. Starts at 0 when missing. */
  cursor?: number;
  signal: AbortSignal;
}

export interface ResourceOptionsBatch {
  /** The offset of the next batch, or `null` after the last one. */
  nextCursor: number | null;
  options: SelectOption[];
}

export type ResourceOptionsLoader = (context: ResourceOptionsLoadContext) => Promise<ResourceOptionsBatch>;

/**
 * Builds the loader a select picker gives to its options helper. `config` is read on every call, so it may
 * be an object with getters that supply live values. The loader asks the page function for one page at
 * the cursor offset, retries a server or network failure once, maps the items to options, and returns them
 * with the offset of the next page. A failure that is not retried, or fails again, is logged once and thrown.
 *
 * @internal Shared by the SDK packages. It is not part of the public API and can change in any release.
 */
const createResourceOptionsLoader = (config: ResourceOptionsLoaderConfig): ResourceOptionsLoader => {
  const logFailure: ResourceFailureLogger = createResourceFailureLogger();

  return async ({cursor, signal}: ResourceOptionsLoadContext): Promise<ResourceOptionsBatch> => {
    const {component, defaults, fetchPage, filter, mapping, pageSize, resource} = config;
    const offset: number = cursor ?? 0;

    const page: SelectPage = await loadPageWithRetryAndLog(
      resource,
      {limit: pageSize, logFailure, offset, signal},
      () => fetchPage({component, filter, limit: pageSize, offset, signal}),
    );

    return {
      nextCursor: isAdvancingPageOffset(offset, page.nextOffset) ? page.nextOffset : null,
      options: page.options ?? toSelectOptions(page.items ?? [], mapping, defaults),
    };
  };
};

export default createResourceOptionsLoader;
