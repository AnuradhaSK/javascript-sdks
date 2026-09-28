// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {FC} from 'react';
import BaseAuthFlowSelect, {BaseAuthFlowSelectProps} from './BaseAuthFlowSelect';
import useFetchAuthFlows from '../../../hooks/useFetchAuthFlows';

export type AuthFlowSelectProps = Omit<BaseAuthFlowSelectProps, 'fetchAuthFlows'>;

/**
 * Authentication-flow picker for signed-in screens. It loads the authentication flows itself with the
 * signed-in user's access token and submits the chosen flow's ID, so it takes no data source. For any
 * other data source use `Select` with `useInfiniteOptions`.
 */
const AuthFlowSelect: FC<AuthFlowSelectProps> = (props: AuthFlowSelectProps) => (
  <BaseAuthFlowSelect {...props} fetchAuthFlows={useFetchAuthFlows()} />
);

export default AuthFlowSelect;
