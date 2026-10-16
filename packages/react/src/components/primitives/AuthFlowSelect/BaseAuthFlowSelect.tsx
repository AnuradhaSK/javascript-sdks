// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {AuthFlowSelectConstants, EmbeddedFlowComponentType} from '@thunderid/browser';
import type {FetchAuthFlows, SelectOptionDefaults} from '@thunderid/browser';
import {FC} from 'react';
import ResourceSelect, {ResourceSelectProps} from '../Select/ResourceSelect';

export interface BaseAuthFlowSelectProps
  extends Omit<
    ResourceSelectProps,
    'bemBlock' | 'defaults' | 'fallbackMessages' | 'fetchPage' | 'mapping' | 'messageKey' | 'resource' | 'type'
  > {
  fetchAuthFlows?: FetchAuthFlows;
}

const AUTH_FLOW_DEFAULTS: SelectOptionDefaults = {labelAttributes: AuthFlowSelectConstants.LABEL_ATTRIBUTES};

/**
 * Authentication-flow picker: a `Select` that loads from the given `fetchAuthFlows`, showing each
 * flow by its name and submitting its ID. Building block for {@link AuthFlowSelect}; for a custom
 * data source use `Select` with `useInfiniteOptions`.
 */
const BaseAuthFlowSelect: FC<BaseAuthFlowSelectProps> = ({fetchAuthFlows, ...rest}: BaseAuthFlowSelectProps) => (
  <ResourceSelect
    {...rest}
    bemBlock="auth-flow-select"
    defaults={AUTH_FLOW_DEFAULTS}
    fallbackMessages={{
      ariaLabel: 'Select a login flow',
      empty: 'No login flows found.',
    }}
    fetchPage={fetchAuthFlows}
    messageKey="auth_flow_select"
    resource="auth flows"
    type={EmbeddedFlowComponentType.AuthFlowSelect}
  />
);

export default BaseAuthFlowSelect;
