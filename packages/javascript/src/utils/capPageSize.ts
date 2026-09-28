// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import SelectConstants from '../constants/SelectConstants';

/**
 * Caps a requested page size at what the management API serves. `undefined` is left for the server's default, and
 * a value below the minimum is left for the request to reject.
 *
 * @internal Shared by the SDK packages. It is not part of the public API and can change in any release.
 */
const capPageSize = (limit?: number): number | undefined =>
  limit === undefined ? undefined : Math.min(limit, SelectConstants.MAX_PAGE_SIZE);

export default capPageSize;
