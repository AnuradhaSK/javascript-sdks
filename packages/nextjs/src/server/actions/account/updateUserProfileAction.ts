// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

'use server';

import {UpdateMeProfileConfig, User} from '@thunderid/node';
import getClient from '../../getClient';

/**
 * Server action to get the current user.
 * Returns the user profile if signed in.
 */
const updateUserProfileAction = async (
  payload: UpdateMeProfileConfig,
  sessionId?: string,
): Promise<{data: {user: User}; error: string; success: boolean}> => {
  try {
    const client = getClient();
    const user: User = await client.updateUserProfile(payload, sessionId);
    return {data: {user}, error: '', success: true};
  } catch (error) {
    return {
      data: {
        user: {},
      },
      error: `Failed to get user profile: ${error instanceof Error ? error.message : String(error)}`,
      success: false,
    };
  }
};

export default updateUserProfileAction;
