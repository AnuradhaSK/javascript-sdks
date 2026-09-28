// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

/**
 * Returns the error itself when it is an `Error`, otherwise an `Error` carrying the thrown value as text.
 *
 * @internal Shared by the SDK packages. It is not part of the public API and can change in any release.
 */
const toError = (error: unknown): Error => (error instanceof Error ? error : new Error(String(error)));

export default toError;
