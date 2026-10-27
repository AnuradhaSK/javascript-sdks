// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import ThunderIDAPIError from '../../../errors/ThunderIDAPIError';
import {ManagementRequestConfig} from '../../../models/api';

/**
 * The request config of a server-level call: the administration flows and their configuration live on
 * the server at `baseUrl`, whatever collection URL the operation itself was given.
 */
const toServerConfig = (config: ManagementRequestConfig, operation: string): ManagementRequestConfig => {
  if (!config.baseUrl) {
    throw new ThunderIDAPIError(
      'A `baseUrl` is required to run an administration flow.',
      `${operation}-ValidationError-003`,
      'javascript',
      400,
      'Running an administration flow needs the server URL, not only a collection URL.',
    );
  }

  return {...config, url: undefined};
};

export default toServerConfig;
