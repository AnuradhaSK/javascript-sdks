// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import encodePathSegments from './encodePathSegments';

/**
 * Encodes a hierarchical handle path, such as an organization unit path `engineering/platform`, for a
 * `tree/{path}` endpoint. Each handle is percent-encoded and the slashes between them are kept, so the
 * server still sees one segment per level. Leading, trailing and repeated slashes are ignored; a path
 * with no handle is refused.
 *
 * @param operation - Name of the calling operation, used as the prefix of the error code.
 * @param path - The handle path.
 * @returns The encoded path.
 */
const encodeHandlePath = (operation: string, path: string | undefined): string => {
  const handles: string[] = typeof path === 'string' ? path.split('/').filter((handle: string) => handle !== '') : [];

  return encodePathSegments(operation, handles.length > 0 ? handles : [undefined]);
};

export default encodeHandlePath;
