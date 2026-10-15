// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

/**
 * Utility to check if `code` is available in the URL as a search param.
 *
 * @param params - The URL search params to check. Defaults to `window.location.search`.
 * @return `true` if the URL contains a `code` search param, otherwise `false`.
 */
const hasAuthParamsInUrl = (params: string = window.location.search): boolean => {
  const MATCHER = /[?&]code=[^&]+/;

  return MATCHER.test(params);
};

export default hasAuthParamsInUrl;
