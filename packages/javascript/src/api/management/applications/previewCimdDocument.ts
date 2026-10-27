// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {CimdPreviewResponse} from '../../../models/application';
import requestManagementResource from '../../../utils/requestManagementResource';

export interface PreviewCimdDocumentConfig extends ManagementRequestConfig {
  /**
   * The client ID: the URL of the client's metadata document.
   */
  clientId: string;
}

/**
 * Reads a client ID metadata document (CIMD) through the server and returns what it declares, so an
 * application can be registered from it.
 */
const previewCimdDocument = async ({clientId, ...config}: PreviewCimdDocumentConfig): Promise<CimdPreviewResponse> =>
  // The preview is a server endpoint of its own, not part of a collection, so a collection `url`
  // the caller passes does not apply.
  requestManagementResource<CimdPreviewResponse>(
    {...config, url: undefined},
    {
      body: {clientId},
      collection: 'cimd',
      failureMessage: 'Failed to read the client ID metadata document',
      id: 'preview',
      method: 'POST',
      operation: 'previewCimdDocument',
    },
  );

export default previewCimdDocument;
