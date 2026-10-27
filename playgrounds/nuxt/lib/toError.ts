// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

/** Normalizes a thrown value to an `Error`. */
const toError = (caught: unknown): Error => (caught instanceof Error ? caught : new Error(String(caught)));

export default toError;
