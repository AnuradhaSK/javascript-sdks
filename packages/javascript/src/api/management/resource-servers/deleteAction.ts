// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import AdministrationModes, {
  AdministrationFlowConfigKey,
  AdministrationFlowInput,
} from '../../../constants/AdministrationConstants';
import {AdministrationOptions} from '../../../models/administration';
import {ManagementRequestConfig} from '../../../models/api';
import encodePathSegments from '../../../utils/encodePathSegments';
import requestManagementResource from '../../../utils/requestManagementResource';
import runAdministrationFlow from '../administration/runAdministrationFlow';

/**
 * Configuration for the deleteAction request.
 */
export interface DeleteActionConfig extends ManagementRequestConfig, AdministrationOptions {
  /**
   * Identifier of the action to delete.
   */
  actionId: string;
  /**
   * Identifier of the resource the action belongs to. Omit it for an action on the resource server itself.
   */
  resourceId?: string;
  /**
   * Identifier of the resource server.
   */
  resourceServerId: string;
}

/**
 * Deletes an action of a resource server, or of one of its resources when `resourceId` is given. In `flow`
 * mode the configured action deletion flow runs instead, revoking what the action's permission granted
 * before the record goes; when no flow is configured, the action is deleted directly.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves once the action is deleted.
 *
 * @example
 * ```typescript
 * await deleteAction({
 *   baseUrl: 'https://localhost:8090',
 *   actionId,
 *   administrationMode: 'flow',
 *   resourceServerId,
 * });
 * ```
 */
const deleteAction = async ({
  actionId,
  administrationMode,
  resourceId,
  resourceServerId,
  ...config
}: DeleteActionConfig): Promise<void> => {
  // Built first, so a missing identifier is refused before a flow runs.
  const subPath: string =
    resourceId === undefined
      ? `actions/${encodePathSegments('deleteAction', [actionId])}`
      : `resources/${encodePathSegments('deleteAction', [resourceId])}/actions/${encodePathSegments('deleteAction', [actionId])}`;

  if (administrationMode === AdministrationModes.FLOW) {
    const result: Record<string, string> | null = await runAdministrationFlow(
      config,
      AdministrationFlowConfigKey.ACTION_DELETION,
      {
        [AdministrationFlowInput.ACTION]: actionId,
        [AdministrationFlowInput.RESOURCE_SERVER]: resourceServerId,
        ...(resourceId !== undefined ? {[AdministrationFlowInput.RESOURCE]: resourceId} : {}),
      },
      'action deletion',
    );

    if (result !== null) {
      return;
    }
  }

  await requestManagementResource<void>(config, {
    collection: 'resource-servers',
    failureMessage: 'Failed to delete action',
    id: resourceServerId,
    method: 'DELETE',
    operation: 'deleteAction',
    subPath,
  });
};

export default deleteAction;
