// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import resolveApplicationResponseTypes from './resolveApplicationResponseTypes';
import {
  Application,
  ApplicationSubmission,
  InboundAuthConfig,
  InboundAuthTypes,
  UpdateApplicationRequest,
} from '../models/application';

/**
 * Applies an application form's values to an application, keeping every field the form does not touch.
 * The update replaces the application, so the result carries everything the server returned, except the
 * fields the server sets.
 *
 * @param application - The application as the server returned it.
 * @param submission - The form's values. `publicClient` is ignored: it can only be set on create.
 * @returns The update request.
 */
const toUpdateApplicationRequest = (
  application: Application,
  {description, grantTypes, logoUrl, name, redirectUris, url}: ApplicationSubmission,
): UpdateApplicationRequest => {
  // The server sets these, so they do not go back in the update.
  const {createdAt, id, status, updatedAt, ...current}: Application = application;
  void createdAt;
  void id;
  void status;
  void updatedAt;

  return {
    ...current,
    description,
    inboundAuthConfig: current.inboundAuthConfig?.map((inbound: InboundAuthConfig) =>
      inbound.type === InboundAuthTypes.OAUTH2
        ? {
            ...inbound,
            config: {
              ...inbound.config,
              grantTypes,
              redirectUris,
              responseTypes: resolveApplicationResponseTypes(grantTypes, inbound.config.responseTypes),
            },
          }
        : inbound,
    ),
    logoUrl,
    name,
    url,
  };
};

export default toUpdateApplicationRequest;
