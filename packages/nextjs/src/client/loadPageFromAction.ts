// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ThunderIDAPIError, ThunderIDRuntimeError} from '@thunderid/node';
import type {SelectPage} from '@thunderid/node';
import type {SelectPageActionResult} from '../server/actions/runSelectPageAction';

/**
 * Turns a select page server action result into a loader page, or throws the failure it carries. The message was built
 * on the server from fixed words and the status, so it is safe to show to a developer.
 */
const loadPageFromAction = (result: SelectPageActionResult, errorCode: string): SelectPage => {
  if (result.success) {
    return result.page;
  }

  if (result.statusCode !== undefined) {
    throw new ThunderIDAPIError(result.message, errorCode, 'nextjs', result.statusCode);
  }

  throw new ThunderIDRuntimeError(result.message, errorCode, 'nextjs');
};

export default loadPageFromAction;
