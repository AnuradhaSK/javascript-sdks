// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {Application, InboundAuthConfig, InboundAuthTypes, OAuth2Config} from '../models/application';

/**
 * Returns the OAuth configuration of an application, if it has one.
 *
 * @param application - The application, or only its inbound authentication configuration.
 * @returns The OAuth 2.0 configuration, or `undefined` when the application has no OAuth client.
 */
const getApplicationOAuthConfig = (application?: Pick<Application, 'inboundAuthConfig'>): OAuth2Config | undefined =>
  application?.inboundAuthConfig?.find((inbound: InboundAuthConfig) => inbound.type === InboundAuthTypes.OAUTH2)
    ?.config;

export default getApplicationOAuthConfig;
