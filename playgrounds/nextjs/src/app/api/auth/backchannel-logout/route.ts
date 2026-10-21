// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {backchannelLogout} from '@thunderid/nextjs/server';

// Register http://localhost:3001/api/auth/backchannel-logout as the application's back-channel
// logout URI. ThunderID posts a logout_token here when a session ends.
export const {POST} = backchannelLogout();
