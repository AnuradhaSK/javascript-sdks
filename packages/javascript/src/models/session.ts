// Copyright 2020 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

export interface SessionData {
  access_token: string;
  created_at: number;
  expires_in: string;
  id_token: string;
  refresh_token?: string;
  scope: string;
  token_type: string;
}

export interface UserSession {
  scopes: string[];
}
