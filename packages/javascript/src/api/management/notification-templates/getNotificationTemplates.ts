// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ApiFilteringParams, ManagementRequestConfig} from '../../../models/api';
import {NotificationChannel, NotificationTemplateListResponse} from '../../../models/notification-template';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the getNotificationTemplates request.
 */
export interface GetNotificationTemplatesConfig
  extends ManagementRequestConfig,
    Pick<ApiFilteringParams, 'limit' | 'offset'> {
  /**
   * The channel the templates are sent through: `email` or `sms`.
   */
  channel: NotificationChannel;
}

/**
 * Retrieves a page of the notification templates of a channel.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the page the server returned.
 *
 * @example
 * ```typescript
 * const {templates} = await getNotificationTemplates({baseUrl: 'https://localhost:8090', channel: 'email'});
 * ```
 */
const getNotificationTemplates = async ({
  channel,
  limit,
  offset,
  ...config
}: GetNotificationTemplatesConfig): Promise<NotificationTemplateListResponse> =>
  requestManagementResource<NotificationTemplateListResponse>(config, {
    collection: 'notification-templates',
    failureMessage: 'Failed to fetch notification templates',
    id: channel,
    method: 'GET',
    operation: 'getNotificationTemplates',
    query: {limit, offset},
    subPath: 'templates',
  });

export default getNotificationTemplates;
