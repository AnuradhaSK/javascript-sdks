// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {OAuth2GrantTypes, OAuth2ResponseTypes} from '../models/application';

/**
 * The response types an OAuth client needs for its grant types: `code` when the authorization code
 * grant is chosen, and no `code` otherwise. Every other response type the client has is kept.
 *
 * @param grantTypes - The client's grant types.
 * @param current - The client's current response types.
 * @returns The response types to save.
 */
const resolveApplicationResponseTypes = (grantTypes: string[], current: string[] = []): string[] => {
  if (!grantTypes.includes(OAuth2GrantTypes.AUTHORIZATION_CODE)) {
    return current.filter((type: string) => type !== OAuth2ResponseTypes.CODE);
  }

  return current.includes(OAuth2ResponseTypes.CODE) ? current : [...current, OAuth2ResponseTypes.CODE];
};

export default resolveApplicationResponseTypes;
