// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

/** Throws when an ID-scoped request has no ID yet, so its card shows why instead of calling the API. */
const requireId = (id: string | undefined, name: string): string => {
  if (!id) throw new Error(`No ${name} yet`);

  return id;
};

export default requireId;
