// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

'use server';

import getClient from '../../getClient';

/**
 * Server action for initiating the sign-up redirect flow.
 */
const signUpAction = async (): Promise<{
  data?: {signUpUrl?: string};
  error?: string;
  success: boolean;
}> => {
  try {
    const client = getClient();
    const config = client.getConfiguration() as any;
    const signUpUrl: string = config?.signUpUrl ?? '';

    return {data: {signUpUrl}, success: true};
  } catch (error) {
    return {error: String(error), success: false};
  }
};

export default signUpAction;
