// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import findAdministrationFlows from './findAdministrationFlows';
import resolveAdministrationFlowHandles from './resolveAdministrationFlowHandles';
import {AdministrationFlowConfigKeyValue} from '../../../models/administration';
import {ManagementRequestConfig} from '../../../models/api';
import {ManagedFlow} from '../../../models/managed-flow';

/**
 * Resolves each operation whose configured handle names an existing administration flow to that flow's
 * identifier, in one configuration read and one listing walk. An operation with no flow is absent.
 */
const resolveAdministrationFlows = async (
  config: ManagementRequestConfig,
  configKeys: readonly AdministrationFlowConfigKeyValue[],
): Promise<Record<string, string>> => {
  const handles: Record<string, string> = await resolveAdministrationFlowHandles(config, configKeys);
  const flows: Record<string, ManagedFlow> = await findAdministrationFlows(config, Object.values(handles));
  const resolved: Record<string, string> = {};

  Object.entries(handles).forEach(([configKey, handle]: [string, string]) => {
    if (flows[handle]) {
      resolved[configKey] = flows[handle].id;
    }
  });

  return resolved;
};

export default resolveAdministrationFlows;
