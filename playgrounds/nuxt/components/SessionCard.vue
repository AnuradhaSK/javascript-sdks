<script setup lang="ts">
// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {computed, onMounted, ref, watch, type ComputedRef, type Ref} from 'vue';
import {useThunderID} from '#imports';
import {describeError, track} from '~/lib/events';
import {formatClaim, formatDuration} from '~/lib/jwt';
import {loadServerSession, serverSession, serverSessionError, useNow} from '~/lib/session';
import {getDisplayName, getEmail, getInitials} from '~/lib/user';

const sdk = useThunderID();
const {isInitialized, isSignedIn, user} = sdk;
const busy: Ref<string | null> = ref<string | null>(null);
const error: Ref<string | null> = ref<string | null>(null);
const now: Ref<number> = useNow();

const userRecord: ComputedRef<Record<string, unknown> | null> = computed(
  () => (user.value as Record<string, unknown> | null) ?? null,
);

const act = async (label: string, call: () => Promise<unknown>): Promise<void> => {
  busy.value = label;
  error.value = null;

  try {
    await track(label, call);
  } catch (caught) {
    error.value = describeError(caught);
  } finally {
    busy.value = null;
  }
};

onMounted(() => {
  void loadServerSession();
});
watch(isSignedIn, () => {
  void loadServerSession();
});

const expiresAt: ComputedRef<number | null> = computed(() =>
  serverSession.value?.accessTokenExpiresAt ? serverSession.value.accessTokenExpiresAt * 1000 : null,
);
const issuedAt: ComputedRef<number | null> = computed(() => {
  const iat: unknown = serverSession.value?.accessTokenClaims?.iat;

  return typeof iat === 'number' ? iat * 1000 : null;
});
const remaining: ComputedRef<number | null> = computed(() =>
  expiresAt.value && now.value ? expiresAt.value - now.value : null,
);
const percent: ComputedRef<number> = computed(() => {
  if (remaining.value === null || !expiresAt.value || !issuedAt.value) return 0;

  return Math.max(0, Math.min(100, (remaining.value / (expiresAt.value - issuedAt.value)) * 100));
});
const claims: ComputedRef<[string, unknown][]> = computed(() => {
  const session = serverSession.value;

  if (!session?.signedIn) return [];

  return (
    [
      ['sub', session.sub],
      ['scope', session.scopes],
      ['amr', session.idTokenClaims?.amr],
      ['refresh', session.hasRefreshToken ? 'refresh token held by the server' : 'none'],
    ] as [string, unknown][]
  ).filter(([, value]: [string, unknown]) => value !== undefined && value !== null);
});
</script>

<template>
  <section aria-label="Session" class="pg-card">
    <div class="pg-card-head">
      <h2>Session</h2>
      <span class="pg-pill" :data-state="isSignedIn ? 'ok' : isInitialized ? undefined : 'warn'">
        {{ isSignedIn ? 'Signed in' : isInitialized ? 'Signed out' : 'Initializing' }}
      </span>
    </div>
    <div class="pg-card-body">
      <div class="pg-user">
        <div class="pg-avatar" data-size="lg" :data-anon="!isSignedIn" aria-hidden="true">
          {{ isSignedIn ? getInitials(userRecord) : '?' }}
        </div>
        <div>
          <div class="pg-user-name">{{ isSignedIn ? getDisplayName(userRecord) : 'No active session' }}</div>
          <div class="pg-user-sub">
            {{
              isSignedIn
                ? (getEmail(userRecord) ?? serverSession?.sub ?? '')
                : 'Sign in to inspect the server-held session.'
            }}
          </div>
        </div>
      </div>

      <div v-if="isSignedIn">
        <div class="pg-progress-head">
          <span>Access token</span>
          <span class="pg-mono">
            {{
              remaining === null
                ? 'expiry unknown'
                : remaining > 0
                  ? `expires in ${formatDuration(remaining)}`
                  : 'expired, refreshed on next use'
            }}
          </span>
        </div>
        <div
          class="pg-progress"
          role="progressbar"
          aria-label="Access token lifetime remaining"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-valuenow="Math.round(percent)"
        >
          <div :style="{width: `${percent}%`}" />
        </div>
      </div>

      <dl v-if="claims.length > 0" class="pg-dl">
        <template v-for="[key, value] in claims" :key="key">
          <dt>{{ key }}</dt>
          <dd>{{ formatClaim(value) }}</dd>
        </template>
      </dl>

      <p v-if="error ?? serverSessionError" class="pg-cap-note" data-status="fail">
        {{ error ?? serverSessionError }}
      </p>

      <div class="pg-row">
        <template v-if="isSignedIn">
          <button
            type="button"
            class="pg-btn"
            :disabled="!!busy"
            title="Reads the session cookie again with useServerSession()"
            @click="act('useServerSession', loadServerSession)"
          >
            {{ busy === 'useServerSession' ? 'Reading' : 'Reload session' }}
          </button>
          <NuxtLink class="pg-btn" to="/server">Server details</NuxtLink>
          <button
            type="button"
            class="pg-btn"
            data-variant="danger"
            :disabled="!!busy"
            @click="act('signOut', () => sdk.signOut())"
          >
            Sign out
          </button>
        </template>
        <button
          v-else
          type="button"
          class="pg-btn"
          data-variant="primary"
          :disabled="!!busy || !isInitialized"
          @click="act('signIn', () => sdk.signIn())"
        >
          Sign in
        </button>
      </div>
    </div>
  </section>
</template>
