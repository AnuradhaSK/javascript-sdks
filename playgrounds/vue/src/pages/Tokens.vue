<script setup lang="ts">
// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useThunderID} from '@thunderid/vue';
import {computed, ComputedRef, Ref, ref} from 'vue';
import TokenCard from '../components/TokenCard.vue';
import {decodeJwt, DecodedJwt, formatDuration} from '../lib/jwt';
import {SessionSnapshot, useNow, useSession} from '../lib/session';

const {isSignedIn, isInitialized} = useThunderID();
const refreshKey: Ref<number> = ref<number>(0);
const session: Readonly<Ref<SessionSnapshot>> = useSession(refreshKey);
const now: Readonly<Ref<number>> = useNow();

const accessDecoded: ComputedRef<DecodedJwt | null> = computed(() => decodeJwt(session.value.accessToken));
const idDecoded: ComputedRef<DecodedJwt | null> = computed(() =>
  session.value.idToken
    ? (decodeJwt(session.value.idToken) ?? {header: {}, payload: session.value.idClaims ?? {}})
    : null,
);
</script>

<template>
  <main class="pg-main">
    <div class="pg-heading">
      <div>
        <h1>Tokens</h1>
        <p>
          Tokens held by the SDK for this session, decoded locally. Nothing on this page is verified or sent anywhere.
        </p>
      </div>
      <button type="button" class="pg-btn" @click="refreshKey += 1">Reload from SDK</button>
    </div>

    <div v-if="!isSignedIn" class="pg-warning" role="status">
      {{ isInitialized ? 'Sign in from the Overview page to see tokens.' : 'The SDK is still initializing.' }}
    </div>
    <div v-if="session.error" class="pg-warning" role="alert">{{ session.error }}</div>

    <div v-if="isSignedIn" class="pg-stats">
      <div class="pg-stat">
        <div class="pg-stat-label">Access token expires</div>
        <div class="pg-stat-value">
          <strong>{{ session.expiresAt ? formatDuration(session.expiresAt - now) : 'Unknown' }}</strong>
          <span>{{ session.expiresAt ? new Date(session.expiresAt).toLocaleTimeString() : '' }}</span>
        </div>
      </div>
      <div class="pg-stat">
        <div class="pg-stat-label">Refresh token</div>
        <div class="pg-stat-value">
          <strong>{{ session.refreshToken ? 'Present' : 'None' }}</strong>
          <span>value never leaves SDK storage</span>
        </div>
      </div>
      <div class="pg-stat">
        <div class="pg-stat-label">Scope</div>
        <div class="pg-stat-value">
          <span class="pg-mono">{{ session.scope ?? 'unknown' }}</span>
        </div>
      </div>
    </div>

    <div class="pg-grid-2">
      <TokenCard
        label="Access token"
        source="getAccessToken()"
        :token="session.accessToken"
        :decoded="accessDecoded"
        :now="now"
      />
      <TokenCard
        label="ID token"
        source="getIdToken() · getDecodedIdToken()"
        :token="session.idToken"
        :decoded="idDecoded"
        :now="now"
      />
    </div>
  </main>
</template>
