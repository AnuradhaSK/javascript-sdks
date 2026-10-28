// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ApiPaginationLink} from './api';

/**
 * The vendor or protocol of a connection.
 */
export type ConnectionType =
  | 'authzen-pdp'
  | 'email-smtp'
  | 'github'
  | 'google'
  | 'http'
  | 'oauth'
  | 'oidc'
  | 'sms-gateway'
  | 'twilio'
  | 'vonage';

/**
 * The connection types whose usages can be listed.
 */
export type ConnectionTypeWithUsages = Exclude<ConnectionType, 'http'>;

/**
 * What a connection is used for.
 */
export type ConnectionCategory = 'identity-provider' | 'sms-provider' | 'authorization-pdp' | 'email-provider' | 'http';

/**
 * A connection as listed across every type.
 */
export interface ConnectionInstance {
  categories: ConnectionCategory[];
  description?: string;
  id: string;
  name: string;
  type: ConnectionType;
}

/**
 * A page of connections across every type.
 */
export interface ConnectionListResponse {
  connections: ConnectionInstance[];
  count: number;
  links: ApiPaginationLink[];
  startIndex: number;
  totalResults: number;
}

/**
 * A connection as listed for one type.
 */
export interface ConnectionSummary {
  description?: string;
  id: string;
  name: string;
}

/**
 * A connection with its configuration. The fields beyond the common ones depend on `type` (for example
 * `clientId`, `redirectUri` and `scopes` for an identity provider, or `url` and `headers` for an HTTP
 * connection); see the connections API for each type's shape. A credential such as a client secret is
 * returned as the server returns it and is never logged by the SDK.
 */
export interface Connection {
  [key: string]: unknown;
  description?: string;
  id: string;
  name: string;
  type: ConnectionType;
}

/**
 * The payload used to create or update a connection. The fields beyond the common ones depend on the
 * connection type; see the connections API for each type's shape.
 */
export interface ConnectionRequest {
  [key: string]: unknown;
  description?: string;
  name: string;
}

/**
 * A flow that uses a connection.
 */
export interface ConnectionUsage {
  /**
   * What happens to the flow when the connection is deleted.
   */
  behaviorOnDelete: 'fallback' | 'cascade' | 'restrict';
  displayName: string;
  id: string;
  resourceType: 'flow';
}

/**
 * The resources that use a connection.
 */
export interface ConnectionUsagesResponse {
  count?: number;
  /**
   * The number of usages by resource type.
   */
  summary?: Record<string, number>;
  totalResults?: number | null;
  usages?: ConnectionUsage[];
}

/**
 * The configurable options of one connection vendor.
 */
export interface ConnectionVendorMeta {
  [key: string]: unknown;
  authentication?: {
    /**
     * The outbound authentication methods the vendor supports.
     */
    methods?: unknown[];
  };
  vendor?: string;
}

/**
 * The configurable options of the connection vendors.
 */
export interface ConnectionMetaResponse {
  vendors?: ConnectionVendorMeta[];
}
