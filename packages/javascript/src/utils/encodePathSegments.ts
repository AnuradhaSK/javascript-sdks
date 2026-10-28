// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import ThunderIDAPIError from '../errors/ThunderIDAPIError';

/**
 * Encodes the segments of a management sub-resource path, such as a nested identifier, for use as the
 * `subPath` of a management request. Each segment is percent-encoded on its own, so an identifier can
 * never add a path segment of its own, and a missing or blank segment is refused with the same code the
 * request raises for a blank resource identifier.
 *
 * @param operation - Name of the calling operation, used as the prefix of the error code.
 * @param segments - The path segments, in order.
 * @returns The encoded segments joined with `/`.
 */
const encodePathSegments = (operation: string, segments: readonly (string | undefined)[]): string =>
  segments
    .map((segment: string | undefined) => {
      if (typeof segment !== 'string' || segment.trim() === '') {
        throw new ThunderIDAPIError(
          'A resource identifier is required.',
          `${operation}-ValidationError-002`,
          'javascript',
          400,
          'The provided resource identifier is empty.',
        );
      }

      return encodeURIComponent(segment);
    })
    .join('/');

export default encodePathSegments;
