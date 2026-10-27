// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import getApplication from './getApplication';
import updateApplication from './updateApplication';
import AdministrationModes, {
  AdministrationFlowConfigKey,
  AdministrationFlowData,
  AdministrationFlowInput,
} from '../../../constants/AdministrationConstants';
import AdministrationFlowError from '../../../errors/AdministrationFlowError';
import ThunderIDAPIError from '../../../errors/ThunderIDAPIError';
import {AdministrationOptions} from '../../../models/administration';
import {ManagementRequestConfig} from '../../../models/api';
import {Application, InboundAuthConfig} from '../../../models/application';
import generateSecret from '../../../utils/generateSecret';
import runAdministrationFlow from '../administration/runAdministrationFlow';

export interface RegenerateClientSecretConfig extends ManagementRequestConfig, AdministrationOptions {
  /**
   * Identifier of the application.
   */
  applicationId: string;
}

export interface RegenerateClientSecretResult {
  /**
   * The application after the change. Absent when a flow rotated the secret, since the flow does not
   * return the application.
   */
  application?: Application;
  /**
   * The new client secret. This is the only time it can be read.
   */
  clientSecret: string;
}

/**
 * Gives an application a new OAuth client secret. In `flow` mode the configured secret regeneration
 * flow rotates it, revoking what the old secret was used for; otherwise a new secret is generated here
 * and saved on the application.
 */
const regenerateClientSecret = async ({
  administrationMode,
  applicationId,
  ...config
}: RegenerateClientSecretConfig): Promise<RegenerateClientSecretResult> => {
  if (administrationMode === AdministrationModes.FLOW) {
    const result: Record<string, string> | null = await runAdministrationFlow(
      config,
      AdministrationFlowConfigKey.SECRET_REGENERATION,
      {[AdministrationFlowInput.APPLICATION]: applicationId},
      'client secret regeneration',
    );

    if (result !== null) {
      const clientSecret: string | undefined = result[AdministrationFlowData.CLIENT_SECRET];

      if (!clientSecret) {
        throw new AdministrationFlowError(
          'The client secret regeneration flow completed without returning a secret.',
          'regenerateClientSecret-FlowError-001',
        );
      }

      return {clientSecret};
    }
  }

  // The server sets these, so they do not go back in the update.
  const {createdAt, id, status, updatedAt, ...current}: Application = await getApplication({
    ...config,
    applicationId,
  });
  void createdAt;
  void id;
  void status;
  void updatedAt;
  const inboundAuthConfig: InboundAuthConfig[] = current.inboundAuthConfig ?? [];

  if (!inboundAuthConfig.some((inbound: InboundAuthConfig) => inbound.type === 'oauth2')) {
    throw new ThunderIDAPIError(
      'The application has no OAuth client, so it has no client secret to regenerate.',
      'regenerateClientSecret-ValidationError-001',
      'javascript',
      400,
      'The application has no OAuth client.',
    );
  }

  const clientSecret: string = generateSecret();
  const application: Application = await updateApplication({
    ...config,
    applicationId,
    payload: {
      ...current,
      inboundAuthConfig: inboundAuthConfig.map((inbound: InboundAuthConfig) =>
        inbound.type === 'oauth2' ? {...inbound, config: {...inbound.config, clientSecret}} : inbound,
      ),
    },
  });

  return {application, clientSecret};
};

export default regenerateClientSecret;
