// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import ThunderIDError from './ThunderIDError';
import {AdministrationFlowStepError} from '../models/administration';

/**
 * Raised when an administration flow does not complete: a step refused (its code and reason are in
 * {@link AdministrationFlowError.flowError}), the flow asked for input the caller cannot give, or the
 * flow the server configures for the operation no longer exists.
 *
 * A refusal arrives as a completed HTTP request with a failed step rather than as an HTTP error, so it
 * carries the step's code here for the caller to map to a localized message.
 */
export default class AdministrationFlowError extends ThunderIDError {
  /**
   * The error of the step that refused, when one did.
   */
  public readonly flowError: AdministrationFlowStepError;

  constructor(message: string, code: string, flowError: AdministrationFlowStepError = {}) {
    super(message, code, 'javascript');
    this.flowError = flowError;
  }
}
