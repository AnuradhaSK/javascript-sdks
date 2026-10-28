// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import executeAdministrationFlow from './executeAdministrationFlow';
import resolveAdministrationFlowId from './resolveAdministrationFlowId';
import {AdministrationFlowConfigKeyValue} from '../../../models/administration';
import {ManagementRequestConfig} from '../../../models/api';

/**
 * Runs the administration flow the server configures for an operation and returns the values it
 * produced, or returns `null` when none is configured so the caller calls the API directly. See
 * {@link resolveAdministrationFlowId}.
 */
const runAdministrationFlow = async (
  config: ManagementRequestConfig,
  configKey: AdministrationFlowConfigKeyValue,
  inputs: Record<string, string>,
  action: string,
): Promise<Record<string, string> | null> => {
  const flowId: string | null = await resolveAdministrationFlowId(config, configKey, action);

  return flowId === null ? null : executeAdministrationFlow(config, flowId, inputs, action);
};

export default runAdministrationFlow;
