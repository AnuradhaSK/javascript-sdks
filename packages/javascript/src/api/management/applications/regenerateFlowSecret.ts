// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import getApplication from './getApplication';
import updateApplication from './updateApplication';
import {ManagementRequestConfig} from '../../../models/api';
import {Application} from '../../../models/application';
import generateSecret from '../../../utils/generateSecret';

export interface RegenerateFlowSecretConfig extends ManagementRequestConfig {
  /**
   * Identifier of the application.
   */
  applicationId: string;
}

export interface RegenerateFlowSecretResult {
  /**
   * The application after the change.
   */
  application: Application;
  /**
   * The new flow secret. This is the only time it can be read.
   */
  flowSecret: string;
}

/**
 * Gives an application a new flow secret, generated here and saved on the application.
 */
const regenerateFlowSecret = async ({
  applicationId,
  ...config
}: RegenerateFlowSecretConfig): Promise<RegenerateFlowSecretResult> => {
  // The server sets these, so they do not go back in the update.
  const {createdAt, id, status, updatedAt, ...current}: Application = await getApplication({
    ...config,
    applicationId,
  });
  void createdAt;
  void id;
  void status;
  void updatedAt;
  const flowSecret: string = generateSecret();
  const application: Application = await updateApplication({
    ...config,
    applicationId,
    payload: {...current, flowSecret},
  });

  return {application, flowSecret};
};

export default regenerateFlowSecret;
