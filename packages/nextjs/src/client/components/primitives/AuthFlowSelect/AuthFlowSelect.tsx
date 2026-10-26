// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

'use client';

import {BaseAuthFlowSelect, BaseAuthFlowSelectProps} from '@thunderid/react';
import {FC} from 'react';
import fetchAuthFlowsFromServer from '../../../fetchAuthFlowsFromServer';

export type AuthFlowSelectProps = Omit<BaseAuthFlowSelectProps, 'fetchAuthFlows'>;

/**
 * Authentication-flow picker for signed-in screens. Flows load through a server action that uses the
 * signed-in user's server-held session, so the access token never reaches the browser. It takes no
 * data source; for a custom one use `Select` with `useInfiniteOptions`.
 */
const AuthFlowSelect: FC<AuthFlowSelectProps> = (props: AuthFlowSelectProps) => (
  <BaseAuthFlowSelect {...props} fetchAuthFlows={fetchAuthFlowsFromServer} />
);

export default AuthFlowSelect;
