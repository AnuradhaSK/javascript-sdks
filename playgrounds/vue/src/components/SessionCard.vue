<script setup lang="ts">
// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ThunderIDContext, useThunderID} from '@thunderid/vue';
import {computed, ComputedRef, Ref, ref} from 'vue';
import {describeError, track} from '../lib/events';
import {formatClaim, formatDuration} from '../lib/jwt';
import {href} from '../lib/router';
import {asText, SdkUser, toUser} from '../lib/sdk';
import {SessionSnapshot, useNow, useSession} from '../lib/session';
import {getDisplayName, getEmail, getInitials} from '../lib/user';

const sdk: ThunderIDContext = useThunderID();
const {isSignedIn, isInitialized} = sdk;
const user: ComputedRef<SdkUser | null> = computed(() => toUser(sdk.user.value));
const refreshKey: Ref<number> = ref<number>(0);
const busy: Ref<string | null> = ref<string | null>(null);
const error: Ref<string | null> = ref<string | null>(null);
const session: Readonly<Ref<SessionSnapshot>> = useSession(refreshKey);
const now: Readonly<Ref<number>> = useNow();

const act = async (label: string, call: () => Promise<unknown>): Promise<void> => {
  busy.value = label;
  error.value = null;

  try {
    await track(label, call);
    refreshKey.value += 1;
  } catch (caught) {
    error.value = describeError(caught);
  } finally {
    busy.value = null;
  }
};

const remaining: ComputedRef<number | null> = computed(() =>
  session.value.expiresAt ? session.value.expiresAt - now.value : null,
);
const percent: ComputedRef<number> = computed(() => {
  const {expiresAt, issuedAt} = session.value;
  const lifetime: number | null = expiresAt && issuedAt ? expiresAt - issuedAt : null;

  return remaining.value !== null && lifetime ? Math.max(0, Math.min(100, (remaining.value / lifetime) * 100)) : 0;
});
const expiryLabel: ComputedRef<string> = computed(() => {
  if (remaining.value === null) return 'expiry unknown';

  return remaining.value > 0 ? `expires in ${formatDuration(remaining.value)}` : 'expired';
});
const claims: ComputedRef<[string, unknown][]> = computed(() => {
  const {idClaims, scope} = session.value;

  if (!idClaims) return [];

  return (
    [
      ['sub', idClaims['sub']],
      ['scope', scope ?? idClaims['scope']],
      ['amr', idClaims['amr']],
    ] as [string, unknown][]
  ).filter(([, value]: [string, unknown]) => value !== undefined);
});
const pillState: ComputedRef<string | undefined> = computed(() => {
  if (isSignedIn.value) return 'ok';

  return isInitialized.value ? undefined : 'warn';
});
const pillLabel: ComputedRef<string> = computed(() => {
  if (isSignedIn.value) return 'Signed in';

  return isInitialized.value ? 'Signed out' : 'Initializing';
});
</script>

<template>
  <section aria-label="Session" class="pg-card">
    <div class="pg-card-head">
      <h2>Session</h2>
      <span class="pg-pill" :data-state="pillState">{{ pillLabel }}</span>
    </div>
    <div class="pg-card-body">
      <div class="pg-user">
        <div class="pg-avatar" data-size="lg" :data-anon="!isSignedIn" aria-hidden="true">
          {{ isSignedIn ? getInitials(user) : '?' }}
        </div>
        <div>
          <div class="pg-user-name">{{ isSignedIn ? getDisplayName(user) : 'No active session' }}</div>
          <div class="pg-user-sub">
            {{ isSignedIn ? (getEmail(user) ?? asText(user?.['sub'])) : 'Sign in to inspect tokens and claims.' }}
          </div>
        </div>
      </div>

      <div v-if="isSignedIn">
        <div class="pg-progress-head">
          <span>Access token</span>
          <span class="pg-mono">{{ expiryLabel }}</span>
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
        <div v-for="[key, value] in claims" :key="key" style="display: contents">
          <dt>{{ key }}</dt>
          <dd>{{ formatClaim(value) }}</dd>
        </div>
      </dl>

      <p v-if="error ?? session.error" class="pg-cap-note" data-status="fail">{{ error ?? session.error }}</p>

      <div class="pg-row">
        <template v-if="isSignedIn">
          <button
            type="button"
            class="pg-btn"
            :disabled="!!busy"
            title="@thunderid/vue exposes no manual refresh; signInSilently() renews the session instead"
            @click="act('signInSilently', () => sdk.signInSilently())"
          >
            {{ busy === 'signInSilently' ? 'Renewing' : 'Renew silently' }}
          </button>
          <a class="pg-btn" :href="href('tokens')">Decode tokens</a>
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
