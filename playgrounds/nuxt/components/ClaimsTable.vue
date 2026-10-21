<script setup lang="ts">
// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {formatClaim, formatDuration} from '~/lib/jwt';

defineProps<{claims: Record<string, unknown>; now: number}>();

const CLAIM_NOTES: Record<string, string> = {
  acr: 'authentication context class',
  amr: 'authentication methods used',
  aud: 'audience',
  auth_time: 'time the user authenticated',
  azp: 'authorized party',
  client_id: 'client the token was issued to',
  email: 'email address',
  exp: 'expires at',
  iat: 'issued at',
  iss: 'issuer',
  jti: 'token id',
  nbf: 'not valid before',
  nonce: 'replay protection value',
  scope: 'granted scopes',
  sid: 'session id',
  sub: 'subject (user id)',
};

const TIME_CLAIMS: string[] = ['exp', 'iat', 'nbf', 'auth_time'];

const isTime = (key: string, value: unknown): value is number => TIME_CLAIMS.includes(key) && typeof value === 'number';

const relative = (seconds: number, now: number): string => {
  const at: number = seconds * 1000;

  if (!now) return '';

  return at > now ? `in ${formatDuration(at - now)}` : `${formatDuration(now - at)} ago`;
};
</script>

<template>
  <table class="pg-claims">
    <tbody>
      <tr v-for="(value, key) in claims" :key="key">
        <th scope="row">{{ key }}</th>
        <td>
          {{ formatClaim(value) }}
          <small v-if="isTime(String(key), value)">
            {{ new Date(value * 1000).toISOString().replace('T', ' ').slice(0, 19) }} UTC · {{ relative(value, now) }}
          </small>
          <small v-else-if="CLAIM_NOTES[String(key)]">{{ CLAIM_NOTES[String(key)] }}</small>
        </td>
      </tr>
    </tbody>
  </table>
</template>
