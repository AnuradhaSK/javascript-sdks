// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import toServerConfig from './toServerConfig';
import {ADMINISTRATION_FLOW_TYPE} from '../../../constants/AdministrationConstants';
import {ManagementRequestConfig} from '../../../models/api';
import {ManagedFlow, ManagedFlowListResponse} from '../../../models/managed-flow';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Page size used when walking the flow listing to find a handle. It matches the server's maximum page
 * size, so the usual handful of administration flows resolves in one request.
 */
const FLOW_PAGE_SIZE = 100;

/**
 * Finds the administration flows carrying the given handles, in one walk of the listing that stops once
 * every handle is found. A handle with no flow is absent from the result.
 *
 * The listing is paged and newest first, which puts the bootstrap flows last, so pages are walked until
 * the handles are found or the listing ends.
 */
const findAdministrationFlows = async (
  config: ManagementRequestConfig,
  handles: readonly string[],
): Promise<Record<string, ManagedFlow>> => {
  const wanted: Set<string> = new Set<string>(handles);
  const found: Record<string, ManagedFlow> = {};
  const serverConfig: ManagementRequestConfig = toServerConfig(config, 'findAdministrationFlows');

  for (let offset = 0; wanted.size > 0; offset += FLOW_PAGE_SIZE) {
    // Sequential: a page is requested only when the previous one did not complete the set.
    const page: ManagedFlowListResponse | undefined = await requestManagementResource(serverConfig, {
      collection: 'flows',
      failureMessage: 'Failed to list the administration flows',
      method: 'GET',
      operation: 'findAdministrationFlows',
      query: {flowType: ADMINISTRATION_FLOW_TYPE, limit: FLOW_PAGE_SIZE, offset},
    });
    const flows: ManagedFlow[] = page?.flows ?? [];

    flows.forEach((flow: ManagedFlow) => {
      if (wanted.has(flow.handle) && flow.flowType === ADMINISTRATION_FLOW_TYPE) {
        found[flow.handle] = flow;
        wanted.delete(flow.handle);
      }
    });

    // A short page is the last one, so the handles still wanted do not exist.
    if (flows.length < FLOW_PAGE_SIZE) {
      break;
    }
  }

  return found;
};

export default findAdministrationFlows;
