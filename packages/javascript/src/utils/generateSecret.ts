// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import arrayBufferToBase64url from './arrayBufferToBase64url';

/**
 * Generates a random secret: 32 bytes from the platform's cryptographically secure generator, encoded
 * as base64url.
 */
const generateSecret = (): string => arrayBufferToBase64url(crypto.getRandomValues(new Uint8Array(32)).buffer);

export default generateSecret;
