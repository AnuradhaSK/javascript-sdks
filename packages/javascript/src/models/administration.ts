// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import AdministrationModes, {AdministrationFlowConfigKey} from '../constants/AdministrationConstants';

/**
 * How an operation that changes state is carried out. See {@link AdministrationModes}.
 */
export type AdministrationMode = (typeof AdministrationModes)[keyof typeof AdministrationModes];

/**
 * A key of the `flow` server-config section. See {@link AdministrationFlowConfigKey}.
 */
export type AdministrationFlowConfigKeyValue =
  (typeof AdministrationFlowConfigKey)[keyof typeof AdministrationFlowConfigKey];

/**
 * Options of an operation that can run through an administration flow.
 */
export interface AdministrationOptions {
  /**
   * `flow` runs the administration flow the server configures for the operation, and calls the API
   * directly only when none is configured. Reading that configuration needs a token that may read
   * server configuration.
   * @default 'native'
   */
  administrationMode?: AdministrationMode;
}

/**
 * One entry of the `flow` server-config section, naming the administration flow for an operation.
 */
export interface AdministrationFlowConfig {
  defaultHandle?: string;
  expirySeconds?: number;
}

/**
 * One localizable message of a flow error, as the server serializes it.
 */
export interface FlowI18nMessage {
  defaultValue?: string;
  key?: string;
  params?: Record<string, string>;
}

/**
 * The error a refused flow step carries: the step's own error code and reason.
 */
export interface AdministrationFlowStepError {
  code?: string;
  description?: FlowI18nMessage;
  message?: FlowI18nMessage;
}

/**
 * The `POST /flow/execute` response, narrowed to what an administration operation inspects.
 * `data.additionalData` carries the values a flow produces.
 */
export interface AdministrationFlowExecutionResponse {
  data?: {
    additionalData?: Record<string, string>;
  };
  error?: AdministrationFlowStepError;
  executionId?: string;
  flowStatus?: string;
}

/**
 * Options of an account lifecycle operation, such as suspending a user.
 */
export interface AccountLifecycleOptions {
  /**
   * A note from the operator, recorded by the flow (for example the reason for a suspension).
   */
  operatorNote?: string;
}

/**
 * The outcome of an account lifecycle operation.
 */
export interface AccountLifecycleResult {
  /**
   * Whether the flow's email step sent its notification. Absent when the flow has no email step.
   */
  emailSent?: boolean;
}

/**
 * A kind of identity the account lifecycle operations act on.
 */
export type AccountLifecycleSubjectKind = 'agent' | 'application' | 'user';

/**
 * An account lifecycle operation an operator can run. Locking is automatic only, so there is no lock.
 */
export type AccountLifecycleAction = 'suspend' | 'unlock' | 'unsuspend';
