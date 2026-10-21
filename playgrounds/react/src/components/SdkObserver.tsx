// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useThunderID, useUser} from '@thunderid/react';
import {ReactElement, useEffect, useRef} from 'react';
import {logEvent} from '../lib/events';
import {toUser, SdkUser} from '../lib/sdk';
import {getDisplayName} from '../lib/user';

/**
 * Turns changes in the SDK's React state into playground events. @thunderid/react does not expose an
 * event subscription API, so state transitions observed through `useThunderID()` and `useUser()` are
 * the closest public signal.
 */
const SdkObserver = (): ReactElement | null => {
  const sdk = useThunderID();
  const {isInitialized, isSignedIn, isLoading, meta, discovery} = sdk;
  const user: SdkUser | null = toUser(sdk.user);
  const {profile} = useUser();
  const previous = useRef<{isSignedIn: boolean | null}>({isSignedIn: null});

  useEffect(() => {
    if (isInitialized) logEvent('sdk:initialized', 'ThunderIDProvider is ready', 'ok');
  }, [isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;

    const before: boolean | null = previous.current.isSignedIn;

    if (before === null) {
      logEvent(
        isSignedIn ? 'session:restored' : 'session:none',
        isSignedIn ? 'signed in from storage' : 'signed out',
        'info',
      );
    } else if (before !== isSignedIn) {
      logEvent(isSignedIn ? 'signIn:completed' : 'signOut:completed', '', 'ok');
    }

    previous.current.isSignedIn = isSignedIn;
  }, [isInitialized, isSignedIn]);

  useEffect(() => {
    logEvent('sdk:loading', isLoading ? 'true' : 'false', 'info');
  }, [isLoading]);

  useEffect(() => {
    if (user) logEvent('user:loaded', getDisplayName(user), 'ok');
  }, [user]);

  useEffect(() => {
    if (profile) logEvent('profile:loaded', `${Object.keys(profile).length} fields`, 'ok');
  }, [profile]);

  useEffect(() => {
    if (meta) logEvent('flowMeta:loaded', 'GET /flow/meta', 'ok');
  }, [meta]);

  useEffect(() => {
    if (discovery.wellKnown) logEvent('discovery:loaded', String(discovery.wellKnown.issuer ?? ''), 'ok');
  }, [discovery.wellKnown]);

  return null;
};

export default SdkObserver;
