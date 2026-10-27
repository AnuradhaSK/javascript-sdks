// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {
  NotificationChannel,
  NotificationTemplate,
  UpdateNotificationTemplateRequest,
} from '../../../models/notification-template';
import encodePathSegments from '../../../utils/encodePathSegments';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the updateNotificationTemplate request.
 */
export interface UpdateNotificationTemplateConfig extends ManagementRequestConfig {
  /**
   * The channel the templates are sent through: `email` or `sms`.
   */
  channel: NotificationChannel;
  /**
   * The template's new state, in the shape of its channel.
   */
  payload: UpdateNotificationTemplateRequest;
  /**
   * Identifier of the template.
   */
  templateId: string;
}

/**
 * Updates a notification template.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the template as the server stored it.
 *
 * @example
 * ```typescript
 * const template = await updateNotificationTemplate({
 *   baseUrl: 'https://localhost:8090',
 *   channel: 'sms',
 *   templateId,
 *   payload: {content: {body: 'Your code: {{otp}}'}, displayName: 'OTP'},
 * });
 * ```
 */
const updateNotificationTemplate = async ({
  channel,
  payload,
  templateId,
  ...config
}: UpdateNotificationTemplateConfig): Promise<NotificationTemplate> =>
  requestManagementResource<NotificationTemplate>(config, {
    body: payload,
    collection: 'notification-templates',
    failureMessage: 'Failed to update notification template',
    id: channel,
    method: 'PUT',
    operation: 'updateNotificationTemplate',
    subPath: `templates/${encodePathSegments('updateNotificationTemplate', [templateId])}`,
  });

export default updateNotificationTemplate;
