// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

'use server';

import {UserProfile} from '@thunderid/node';
import getClient from '../../getClient';

/**
 * Server action to get the current user.
 * Returns the user profile if signed in.
 */
const getUserProfileAction = async (
  sessionId: string,
): Promise<{data: {userProfile: UserProfile}; error: string | null; success: boolean}> => {
  try {
    const client = getClient();
    const updatedProfile: UserProfile = await client.getUserProfile(sessionId);
    return {data: {userProfile: updatedProfile}, error: null, success: true};
  } catch (error) {
    return {
      data: {
        userProfile: {
          flattenedProfile: {},
          profile: {},
        },
      },
      error: 'Failed to get user profile',
      success: false,
    };
  }
};

export default getUserProfileAction;
