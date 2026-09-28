// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

/**
 * Defaults for turning authentication flows into AUTH_FLOW_SELECT options. The flow ID is submitted.
 */
const AuthFlowSelectConstants: {
  FLOW_TYPE: string;
  LABEL_ATTRIBUTES: readonly string[];
} = {
  /**
   * The only flow type this picker offers; the restriction belongs to the input type.
   */
  FLOW_TYPE: 'AUTHENTICATION',
  /**
   * Fields tried, in order, for a flow's visible label before falling back to the flow's ID.
   */
  LABEL_ATTRIBUTES: ['name', 'handle'],
};

export default AuthFlowSelectConstants;
