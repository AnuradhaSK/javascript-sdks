// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import SelectConstants from '../constants/SelectConstants';

/**
 * The page size a picker asks for: the default when none is given, otherwise the given size as a whole number of
 * at least 1 and at most what the management API serves.
 *
 * @internal Shared by the SDK packages. It is not part of the public API and can change in any release.
 */
const resolvePageSize = (pageSize: number = SelectConstants.DEFAULT_PAGE_SIZE): number =>
  Math.min(Math.max(1, Math.floor(pageSize)), SelectConstants.MAX_PAGE_SIZE);

export default resolvePageSize;
