// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {SessionData} from '@thunderid/javascript';
import {validate as uuidValidate, version as uuidVersion, v4 as uuidv4} from 'uuid';

const UUID_VERSION = 4;

/**
 * Utility class for session validation and UUID management.
 */
class SessionUtils {
  private constructor() {}

  /**
   * Generates a new UUID v4 string.
   *
   * @returns A new UUID string.
   */
  public static createUUID(): string {
    return uuidv4();
  }

  /**
   * Returns `true` if the given string is a valid UUID v4.
   *
   * @param uuid - The UUID string to validate.
   */
  public static validateUUID(uuid: string): Promise<boolean> {
    if (uuidValidate(uuid) && uuidVersion(uuid) === UUID_VERSION) {
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  }

  /**
   * Returns `true` if the session token is still within its validity window.
   *
   * @param sessionData - The session data to check. `expires_in` is in seconds, as the token
   * endpoint returns it, and `created_at` in milliseconds.
   */
  public static validateSession(sessionData: SessionData): Promise<boolean> {
    const currentTime: number = Date.now();
    const expiryTimeStamp: number = sessionData.created_at + parseInt(sessionData.expires_in, 10) * 1000;
    return Promise.resolve(currentTime < expiryTimeStamp);
  }
}

export default SessionUtils;
