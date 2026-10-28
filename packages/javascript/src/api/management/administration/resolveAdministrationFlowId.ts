// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import findAdministrationFlows from './findAdministrationFlows';
import resolveAdministrationFlowHandles from './resolveAdministrationFlowHandles';
import AdministrationFlowError from '../../../errors/AdministrationFlowError';
import {AdministrationFlowConfigKeyValue} from '../../../models/administration';
import {ManagementRequestConfig} from '../../../models/api';
import {ManagedFlow} from '../../../models/managed-flow';

/**
 * Finds the administration flow the server configures for an operation, or returns `null` when none is
 * configured so the caller calls the API directly.
 *
 * Only an unset handle yields `null`: that is the deployment asking for the direct call. A handle that
 * names a flow that no longer exists raises instead, since falling back would make the change without
 * the revocation the configuration asks for.
 */
const resolveAdministrationFlowId = async (
  config: ManagementRequestConfig,
  configKey: AdministrationFlowConfigKeyValue,
  action: string,
): Promise<string | null> => {
  const handle: string | undefined = (await resolveAdministrationFlowHandles(config, [configKey]))[configKey];

  if (!handle) {
    return null;
  }

  const flow: ManagedFlow | undefined = (await findAdministrationFlows(config, [handle]))[handle];

  if (!flow) {
    throw new AdministrationFlowError(
      `The configured ${action} flow "${handle}" no longer exists, so the action was not performed. ` +
        'Restore the flow or clear the handle from the server configuration.',
      'resolveAdministrationFlowId-NotFoundError-001',
    );
  }

  return flow.id;
};

export default resolveAdministrationFlowId;
