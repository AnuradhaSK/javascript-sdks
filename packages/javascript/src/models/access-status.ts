// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

/**
 * An identity's effective access status, with precedence `SUSPENDED` over `LOCKED` over `ACTIVE`.
 * Applications are never `LOCKED`.
 */
export type AccessStatusValue = 'ACTIVE' | 'LOCKED' | 'SUSPENDED';

/**
 * What put an identity into the status it reports.
 */
export type AccessHoldReason = 'ADMINISTRATIVE_SUSPENSION' | 'FAILED_ATTEMPTS' | 'SUSPENSION_RELEASE_LOCK';

/**
 * One live automatic lock: the authentication method it holds, and when it lifts.
 */
export interface AccessLockedMethod {
  /**
   * When the lock lifts on its own. Absent when it lasts until released.
   */
  expiresAt?: string;
  /**
   * The authentication method the lock holds, or `account` for all of them.
   */
  method: string;
}

/**
 * What a management read says about a status beyond its value.
 */
export interface AccessStatusDetails {
  /**
   * Every live automatic lock. Absent for a status that is not a lock.
   */
  lockedMethods?: AccessLockedMethod[];
  /**
   * The operator's note on an administrative hold. Render it as text, never as markup.
   */
  operatorNote?: string;
  reason?: AccessHoldReason;
  /**
   * When an administrative hold was placed. Absent for an automatic lock.
   */
  since?: string;
}

/**
 * The access status a management read of a user or an agent carries. The server computes it on read
 * and never accepts it on a write.
 */
export interface AccessStatus {
  /**
   * What produced the status. Absent when there is nothing to add.
   */
  details?: AccessStatusDetails;
  value: AccessStatusValue;
}
