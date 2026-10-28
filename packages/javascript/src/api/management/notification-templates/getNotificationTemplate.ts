// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {NotificationChannel, NotificationTemplate} from '../../../models/notification-template';
import encodePathSegments from '../../../utils/encodePathSegments';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the getNotificationTemplate request.
 */
export interface GetNotificationTemplateConfig extends ManagementRequestConfig {
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
 * Retrieves a notification template.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the template.
 *
 * @example
 * ```typescript
 * const template = await getNotificationTemplate({baseUrl: 'https://localhost:8090', channel: 'email', templateId});
 * ```
 */
const getNotificationTemplate = async ({
  channel,
  templateId,
  ...config
}: GetNotificationTemplateConfig): Promise<NotificationTemplate> =>
  requestManagementResource<NotificationTemplate>(config, {
    collection: 'notification-templates',
    failureMessage: 'Failed to fetch notification template',
    id: channel,
    method: 'GET',
    operation: 'getNotificationTemplate',
    subPath: `templates/${encodePathSegments('getNotificationTemplate', [templateId])}`,
  });

export default getNotificationTemplate;
