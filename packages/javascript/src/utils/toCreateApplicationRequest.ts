// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import resolveApplicationResponseTypes from './resolveApplicationResponseTypes';
import {
  ApplicationSubmission,
  CreateApplicationRequest,
  InboundAuthTypes,
  TokenEndpointAuthMethods,
} from '../models/application';

/**
 * Builds the request that creates an application with an OAuth client from an application form's values.
 * A public client gets no client secret, must use PKCE, and does not authenticate at the token endpoint.
 *
 * @param submission - The form's values.
 * @param ouId - The organization unit the application belongs to.
 * @returns The create request.
 */
const toCreateApplicationRequest = (
  {description, grantTypes, logoUrl, name, publicClient = false, redirectUris, url}: ApplicationSubmission,
  ouId: string,
): CreateApplicationRequest => ({
  description,
  inboundAuthConfig: [
    {
      config: {
        grantTypes,
        pkceRequired: publicClient || undefined,
        publicClient,
        redirectUris,
        responseTypes: resolveApplicationResponseTypes(grantTypes),
        tokenEndpointAuthMethod: publicClient
          ? TokenEndpointAuthMethods.NONE
          : TokenEndpointAuthMethods.CLIENT_SECRET_BASIC,
      },
      type: InboundAuthTypes.OAUTH2,
    },
  ],
  logoUrl,
  name,
  ouId,
  url,
});

export default toCreateApplicationRequest;
