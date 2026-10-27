// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ApiPaginationLink} from './api';

/**
 * The channel a notification template is sent through.
 */
export type NotificationChannel = 'email' | 'sms';

/**
 * A notification template as listed.
 */
export interface NotificationTemplateSummary {
  description?: string;
  displayName: string;
  handle: string;
  id: string;
  /**
   * The template's own URL.
   */
  self: string;
}

/**
 * A page of notification templates.
 */
export interface NotificationTemplateListResponse {
  count?: number;
  links?: ApiPaginationLink[];
  startIndex?: number;
  templates: NotificationTemplateSummary[];
  totalResults?: number;
}

/**
 * How an email template is laid out.
 */
export interface NotificationTemplateDesign {
  colorScheme?: 'light' | 'dark';
}

/**
 * The content of an email template.
 */
export interface EmailTemplateContent {
  body: string;
  subject: string;
}

/**
 * The content of an SMS template.
 */
export interface SmsTemplateContent {
  body: string;
}

/**
 * An email notification template.
 */
export interface EmailNotificationTemplate {
  content: EmailTemplateContent;
  description?: string;
  design?: NotificationTemplateDesign;
  displayName: string;
  handle: string;
  id: string;
  isReadOnly?: boolean;
  ouId: string;
}

/**
 * An SMS notification template.
 */
export interface SmsNotificationTemplate {
  content: SmsTemplateContent;
  description?: string;
  displayName: string;
  handle: string;
  id: string;
  isReadOnly?: boolean;
  ouId: string;
}

/**
 * A notification template.
 */
export type NotificationTemplate = EmailNotificationTemplate | SmsNotificationTemplate;

/**
 * The payload used to create an email template.
 */
export interface CreateEmailTemplateRequest {
  content: EmailTemplateContent;
  description?: string;
  design?: NotificationTemplateDesign;
  displayName: string;
  handle: string;
  ouId: string;
}

/**
 * The payload used to create an SMS template.
 */
export interface CreateSmsTemplateRequest {
  content: SmsTemplateContent;
  description?: string;
  displayName: string;
  handle: string;
  ouId: string;
}

/**
 * The payload used to create a notification template.
 */
export type CreateNotificationTemplateRequest = CreateEmailTemplateRequest | CreateSmsTemplateRequest;

/**
 * The payload used to update an email template.
 */
export type UpdateEmailTemplateRequest = Omit<CreateEmailTemplateRequest, 'handle' | 'ouId'>;

/**
 * The payload used to update an SMS template.
 */
export type UpdateSmsTemplateRequest = Omit<CreateSmsTemplateRequest, 'handle' | 'ouId'>;

/**
 * The payload used to update a notification template.
 */
export type UpdateNotificationTemplateRequest = UpdateEmailTemplateRequest | UpdateSmsTemplateRequest;
