// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ApplicationSubmission, OAuth2GrantTypes} from '../models/application';

/**
 * Whether an application form's values can be submitted: a name, at least one grant type, a redirect
 * URI when the authorization code grant is chosen, and no client credentials grant for a public client,
 * which has no secret to authenticate with.
 *
 * @param submission - The form's values.
 * @returns `true` when the values can be submitted.
 */
const isApplicationSubmissionValid = ({
  grantTypes,
  name,
  publicClient = false,
  redirectUris,
}: ApplicationSubmission): boolean =>
  Boolean(name.trim()) &&
  grantTypes.length > 0 &&
  (!grantTypes.includes(OAuth2GrantTypes.AUTHORIZATION_CODE) || redirectUris.length > 0) &&
  !(publicClient && grantTypes.includes(OAuth2GrantTypes.CLIENT_CREDENTIALS));

export default isApplicationSubmissionValid;
