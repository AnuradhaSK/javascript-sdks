// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

/**
 * Splits the text of a redirect URIs field into URIs. URIs may be separated by whitespace, new lines
 * or commas, and blank entries are dropped.
 *
 * @param text - The text of the field.
 * @returns The redirect URIs.
 */
const parseRedirectUris = (text: string): string[] =>
  text
    .split(/[\s,]+/)
    .map((uri: string) => uri.trim())
    .filter(Boolean);

export default parseRedirectUris;
