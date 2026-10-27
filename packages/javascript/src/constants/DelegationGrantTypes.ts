// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

/**
 * The OAuth grant types that let an agent act on behalf of a signed-in user: authorization code, CIBA
 * and token exchange. An agent holding any of them is delegated, the rule the server applies when it
 * checks an agent's grants.
 */
const DelegationGrantTypes: readonly string[] = [
  'authorization_code',
  'urn:openid:params:grant-type:ciba',
  'urn:ietf:params:oauth:grant-type:token-exchange',
];

export default DelegationGrantTypes;
