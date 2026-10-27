// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {NotificationChannel} from '../../../models/notification-template';
import encodePathSegments from '../../../utils/encodePathSegments';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the deleteNotificationTemplate request.
 */
export interface DeleteNotificationTemplateConfig extends ManagementRequestConfig {
  /**
   * The channel the templates are sent through: `email` or `sms`.
   */
  channel: NotificationChannel;
  /**
   * Identifier of the template.
   */
  templateId: string;
}

/**
 * Deletes a notification template.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves once the server has made the change.
 *
 * @example
 * ```typescript
 * await deleteNotificationTemplate({baseUrl: 'https://localhost:8090', channel: 'email', templateId});
 * ```
 */
const deleteNotificationTemplate = async ({
  channel,
  templateId,
  ...config
}: DeleteNotificationTemplateConfig): Promise<void> => {
  await requestManagementResource<void>(config, {
    collection: 'notification-templates',
    failureMessage: 'Failed to delete notification template',
    id: channel,
    method: 'DELETE',
    operation: 'deleteNotificationTemplate',
    subPath: `templates/${encodePathSegments('deleteNotificationTemplate', [templateId])}`,
  });
};

export default deleteNotificationTemplate;
