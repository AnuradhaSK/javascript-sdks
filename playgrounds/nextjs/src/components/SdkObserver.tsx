// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

'use client';

import {useThunderID} from '@thunderid/nextjs';
import {useThunderID as useReactThunderID, useUser} from '@thunderid/react';
import {ReactElement, useEffect, useRef} from 'react';
import {logEvent} from '../lib/events';
import {toUser, SdkUser} from '../lib/sdk';
import {getDisplayName} from '../lib/user';

/**
 * Turns changes in the SDK's client state into playground events. @thunderid/nextjs exposes no
 * event subscription, and the session is resolved on the server, so state transitions observed
 * through `useThunderID()` and `useUser()` are the closest public signal.
 */
const SdkObserver = (): ReactElement | null => {
  const sdk = useThunderID();
  const {meta} = useReactThunderID();
  const isSignedIn = !!sdk.isSignedIn;
  const isLoading = !!sdk.isLoading;
  const user: SdkUser | null = toUser(sdk.user);
  const {profile} = useUser();
  const previous = useRef<{isSignedIn: boolean | null}>({isSignedIn: null});

  useEffect(() => {
    if (!isLoading) logEvent('sdk:ready', 'ThunderIDProvider resolved the session on the server', 'ok');
  }, [isLoading]);

  useEffect(() => {
    if (isLoading) return;

    const before: boolean | null = previous.current.isSignedIn;

    if (before === null) {
      logEvent(
        isSignedIn ? 'session:restored' : 'session:none',
        isSignedIn ? 'session cookie verified on the server' : 'signed out',
        'info',
      );
    } else if (before !== isSignedIn) {
      logEvent(isSignedIn ? 'signIn:completed' : 'signOut:completed', '', 'ok');
    }

    previous.current.isSignedIn = isSignedIn;
  }, [isLoading, isSignedIn]);

  useEffect(() => {
    if (user && Object.keys(user).length) logEvent('user:loaded', getDisplayName(user), 'ok');
  }, [user]);

  useEffect(() => {
    if (profile && Object.keys(profile).length)
      logEvent('profile:loaded', `${Object.keys(profile).length} fields`, 'ok');
  }, [profile]);

  useEffect(() => {
    if (meta) logEvent('flowMeta:loaded', 'GET /flow/meta (fetched on the server)', 'ok');
  }, [meta]);

  return null;
};

export default SdkObserver;
