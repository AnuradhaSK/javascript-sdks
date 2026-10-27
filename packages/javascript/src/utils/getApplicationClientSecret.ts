// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import getApplicationOAuthConfig from './getApplicationOAuthConfig';
import {Application} from '../models/application';

/**
 * The client secret the server returned with an application, if any. It is readable only right after
 * the application is created.
 *
 * @param application - The application the server returned.
 * @returns The client secret, or `undefined` when there is none.
 */
const getApplicationClientSecret = (application?: Application): string | undefined => {
  const secret: string | undefined = getApplicationOAuthConfig(application)?.clientSecret;

  // An empty secret is no secret.
  return secret === '' ? undefined : secret;
};

export default getApplicationClientSecret;
