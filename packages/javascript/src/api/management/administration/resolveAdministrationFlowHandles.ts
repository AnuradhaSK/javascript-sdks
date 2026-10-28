// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import toServerConfig from './toServerConfig';
import {AdministrationFlowConfig, AdministrationFlowConfigKeyValue} from '../../../models/administration';
import {ManagementRequestConfig} from '../../../models/api';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Reads the handle configured for each of several operations in one request. An operation with no
 * handle is absent from the result.
 *
 * Read failures propagate: treating one as "no flow configured" would perform the operation through
 * the API directly, which revokes nothing, and report it as a success.
 */
const resolveAdministrationFlowHandles = async (
  config: ManagementRequestConfig,
  configKeys: readonly AdministrationFlowConfigKeyValue[],
): Promise<Record<string, string>> => {
  // The server returns the declarative, writable and merged layers; only the merged one is applied.
  const layers: {merged?: Record<string, AdministrationFlowConfig>} | undefined = await requestManagementResource(
    toServerConfig(config, 'resolveAdministrationFlowHandles'),
    {
      collection: 'server-config',
      failureMessage: 'Failed to read the administration flow configuration',
      id: 'flow',
      method: 'GET',
      operation: 'resolveAdministrationFlowHandles',
    },
  );
  const section: Record<string, AdministrationFlowConfig> = layers?.merged ?? {};
  const handles: Record<string, string> = {};

  configKeys.forEach((configKey: AdministrationFlowConfigKeyValue) => {
    const handle: string | undefined = section[configKey]?.defaultHandle;

    if (handle) {
      handles[configKey] = handle;
    }
  });

  return handles;
};

export default resolveAdministrationFlowHandles;
