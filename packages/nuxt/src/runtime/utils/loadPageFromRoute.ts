// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ThunderIDAPIError, ThunderIDRuntimeError} from '@thunderid/browser';
import type {SelectPage} from '@thunderid/browser';
import type {ThunderIDSelectPageResult} from '../types';

/**
 * Loads one page from a select page route and returns it, or throws the failure the route carries. The message was
 * built on the server from fixed words and the status, so it is safe to show to a developer.
 */
const loadPageFromRoute = async (
  route: string,
  query: Record<string, number | string | undefined>,
  signal: AbortSignal,
  errorCode: string,
): Promise<SelectPage> => {
  const result: ThunderIDSelectPageResult = await $fetch<ThunderIDSelectPageResult>(route, {query, signal});

  if (result.success) {
    return result.page;
  }

  if (result.statusCode !== undefined) {
    throw new ThunderIDAPIError(result.message, errorCode, 'nuxt', result.statusCode);
  }

  throw new ThunderIDRuntimeError(result.message, errorCode, 'nuxt');
};

export default loadPageFromRoute;
