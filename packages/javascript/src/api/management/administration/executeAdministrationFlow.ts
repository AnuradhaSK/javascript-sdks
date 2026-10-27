// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import toServerConfig from './toServerConfig';
import AdministrationFlowError from '../../../errors/AdministrationFlowError';
import {AdministrationFlowExecutionResponse} from '../../../models/administration';
import {ManagementRequestConfig} from '../../../models/api';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Runs an administration flow to completion in one call and returns the values it produced.
 *
 * Every input the flow needs is given up front, so it should finish without pausing. A flow that asks
 * for more input, or a step that refuses, raises {@link AdministrationFlowError}.
 */
const executeAdministrationFlow = async (
  config: ManagementRequestConfig,
  flowId: string,
  inputs: Record<string, string>,
  action: string,
): Promise<Record<string, string>> => {
  const result: AdministrationFlowExecutionResponse | undefined = await requestManagementResource(
    toServerConfig(config, 'executeAdministrationFlow'),
    {
      body: {flowId, inputs},
      collection: 'flow',
      failureMessage: `Failed to run the ${action} flow`,
      id: 'execute',
      method: 'POST',
      operation: 'executeAdministrationFlow',
    },
  );

  if (result?.flowStatus === 'COMPLETE') {
    return result.data?.additionalData ?? {};
  }

  if (result?.flowStatus === 'INCOMPLETE') {
    throw new AdministrationFlowError(
      `The ${action} flow requires additional input and could not be completed.`,
      'executeAdministrationFlow-IncompleteError-001',
    );
  }

  const flowError: AdministrationFlowExecutionResponse['error'] = result?.error ?? {};

  throw new AdministrationFlowError(
    flowError.message?.defaultValue ?? flowError.description?.defaultValue ?? `The ${action} flow did not complete.`,
    flowError.code ?? 'executeAdministrationFlow-FlowError-001',
    flowError,
  );
};

export default executeAdministrationFlow;
