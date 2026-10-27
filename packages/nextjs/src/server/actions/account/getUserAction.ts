// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

'use server';

import {User} from '@thunderid/node';
import getClient from '../../getClient';

/**
 * Server action to get the current user.
 * Returns the user profile if signed in.
 */
const getUserAction = async (
  sessionId: string,
): Promise<{data: {user: User | null}; error: string | null; success: boolean}> => {
  try {
    const client = getClient();
    const user: User = await client.getUser(sessionId);
    return {data: {user}, error: null, success: true};
  } catch (error) {
    return {data: {user: null}, error: 'Failed to get user', success: false};
  }
};

export default getUserAction;
