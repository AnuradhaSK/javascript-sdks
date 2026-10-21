// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {FlowMetaContextValue, ThunderIDContext, useFlowMeta, useThunderID, useUser} from '@thunderid/vue';
import {watch} from 'vue';
import {logEvent} from './events';
import {toUser} from './sdk';
import {getDisplayName} from './user';

/**
 * Turns changes in the SDK's reactive state into playground events. @thunderid/vue does not expose an
 * event subscription API, so the refs returned by `useThunderID()`, `useUser()`, and `useFlowMeta()`
 * are the closest public signal.
 */
export const useSdkObserver = (): void => {
  const sdk: ThunderIDContext = useThunderID();
  const {profile} = useUser();
  const flowMeta: FlowMetaContextValue = useFlowMeta();
  let previous: boolean | null = null;

  watch(sdk.isInitialized, (ready: boolean) => {
    if (ready) logEvent('sdk:initialized', 'ThunderIDProvider is ready', 'ok');
  });

  watch(
    [sdk.isInitialized, sdk.isSignedIn],
    ([ready, signedIn]: [boolean, boolean]) => {
      if (!ready) return;

      if (previous === null) {
        logEvent(
          signedIn ? 'session:restored' : 'session:none',
          signedIn ? 'signed in from storage' : 'signed out',
          'info',
        );
      } else if (previous !== signedIn) {
        logEvent(signedIn ? 'signIn:completed' : 'signOut:completed', '', 'ok');
      }

      previous = signedIn;
    },
    {immediate: true},
  );

  watch(sdk.isLoading, (loading: boolean) => logEvent('sdk:loading', loading ? 'true' : 'false', 'info'));

  watch(sdk.user, (user: unknown) => {
    if (user) logEvent('user:loaded', getDisplayName(toUser(user)), 'ok');
  });

  watch(profile, (value: unknown) => {
    if (value) logEvent('profile:loaded', `${Object.keys(value as object).length} fields`, 'ok');
  });

  watch(
    flowMeta.meta,
    (meta: unknown) => {
      if (meta) logEvent('flowMeta:loaded', 'GET /flow/meta', 'ok');
    },
    {immediate: true},
  );

  watch(flowMeta.error, (error: Error | null) => {
    if (error) logEvent('flowMeta:failed', error.message, 'error');
  });
};
