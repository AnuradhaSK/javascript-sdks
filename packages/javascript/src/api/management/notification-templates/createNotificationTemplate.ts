// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {
  CreateNotificationTemplateRequest,
  NotificationChannel,
  NotificationTemplate,
} from '../../../models/notification-template';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the createNotificationTemplate request.
 */
export interface CreateNotificationTemplateConfig extends ManagementRequestConfig {
  /**
   * The channel the templates are sent through: `email` or `sms`.
   */
  channel: NotificationChannel;
  /**
   * The template to create, in the shape of its channel.
   */
  payload: CreateNotificationTemplateRequest;
}

/**
 * Creates a notification template on a channel.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the template as the server stored it.
 *
 * @example
 * ```typescript
 * const template = await createNotificationTemplate({
 *   baseUrl: 'https://localhost:8090',
 *   channel: 'sms',
 *   payload: {content: {body: 'Your code is {{otp}}'}, displayName: 'OTP', handle: 'otp', ouId},
 * });
 * ```
 */
const createNotificationTemplate = async ({
  channel,
  payload,
  ...config
}: CreateNotificationTemplateConfig): Promise<NotificationTemplate> =>
  requestManagementResource<NotificationTemplate>(config, {
    body: payload,
    collection: 'notification-templates',
    failureMessage: 'Failed to create notification template',
    id: channel,
    method: 'POST',
    operation: 'createNotificationTemplate',
    subPath: 'templates',
  });

export default createNotificationTemplate;
