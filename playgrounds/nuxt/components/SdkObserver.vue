<script setup lang="ts">
// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {onMounted, watch} from 'vue';
import {useFlowMeta, useState, useThunderID, useUser} from '#imports';
import {logEvent} from '~/lib/events';
import type {SsrSnapshot} from '~/lib/types';
import {getDisplayName} from '~/lib/user';

/**
 * Turns changes in the SDK's reactive state into playground events. @thunderid/nuxt has no event
 * subscription API, so state observed through the composables is the closest public signal.
 */
const {isInitialized, isSignedIn, user} = useThunderID();
const {profile} = useUser();
const {meta} = useFlowMeta();
const ssr = useState<SsrSnapshot | null>('playground:ssr');

onMounted(() => {
  if (ssr.value) {
    logEvent(
      'ssr:context',
      ssr.value.present ? `isSignedIn ${String(ssr.value.isSignedIn)} on ${ssr.value.path}` : 'not populated',
      ssr.value.present ? 'ok' : 'error',
    );
  }
  logEvent(isInitialized.value ? 'sdk:hydrated' : 'sdk:loading', 'auth state from the Nuxt payload', 'ok');
  logEvent(
    isSignedIn.value ? 'session:restored' : 'session:none',
    isSignedIn.value ? 'signed in from the session cookie' : 'signed out',
    'info',
  );
  if (user.value) logEvent('user:loaded', getDisplayName(user.value as Record<string, unknown>), 'ok');
  if (profile.value) logEvent('profile:loaded', `${Object.keys(profile.value).length} fields`, 'ok');
  if (meta.value) logEvent('flowMeta:loaded', 'seeded by the server render', 'ok');

  watch(isSignedIn, (now: boolean) => logEvent(now ? 'signIn:completed' : 'signOut:completed', '', 'ok'));
  watch(user, (next: unknown) => {
    if (next) logEvent('user:loaded', getDisplayName(next as Record<string, unknown>), 'ok');
  });
  watch(profile, (next: unknown) => {
    if (next) logEvent('profile:loaded', `${Object.keys(next as object).length} fields`, 'ok');
  });
  watch(meta, (next: unknown) => {
    if (next) logEvent('flowMeta:loaded', 'GET /api/auth/meta', 'ok');
  });
});
</script>

<template>
  <span hidden />
</template>
