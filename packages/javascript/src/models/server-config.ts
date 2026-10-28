// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

/**
 * A server configuration section in its layers: the read-only layer from the deployment, the writable
 * layer the management API changes, and the two merged, which is what the server applies.
 */
export interface ServerConfigLayers<T = unknown> {
  merged: T;
  readOnly: T;
  writable: T;
}
