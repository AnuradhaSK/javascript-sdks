// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import toListSelectPage from './toListSelectPage';
import AuthFlowSelectConstants from '../constants/AuthFlowSelectConstants';
import type {ManagedFlowListResponse} from '../models/managed-flow';
import type {SelectPage} from '../models/select-page';
import type {SelectOption} from '../models/select';

/**
 * Converts a `getFlows` response into a loader page: each flow is shown by its name and submits its ID.
 */
const toAuthFlowSelectPage = (
  response: ManagedFlowListResponse,
  requestOffset: number,
): SelectPage & {options: SelectOption[]} =>
  toListSelectPage(response.flows, response, requestOffset, undefined, {
    labelAttributes: AuthFlowSelectConstants.LABEL_ATTRIBUTES,
  });

export default toAuthFlowSelectPage;
