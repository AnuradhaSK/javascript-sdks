<script setup lang="ts">
// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {computed, ComputedRef, Ref, ref} from 'vue';
import ClaimsTable from './ClaimsTable.vue';
import {DecodedJwt} from '../lib/jwt';

const props = defineProps<{
  decoded: DecodedJwt | null;
  label: string;
  now: number;
  source: string;
  token: string | null;
}>();

const revealed: Ref<boolean> = ref<boolean>(false);
const copied: Ref<boolean> = ref<boolean>(false);

const shown: ComputedRef<string> = computed(() => {
  if (!props.token) return 'No token';
  if (revealed.value) return props.token;

  return `${props.token.slice(0, 12)}${'•'.repeat(24)}${props.token.slice(-6)}`;
});

const copy = async (): Promise<void> => {
  if (!props.token) return;

  try {
    await navigator.clipboard.writeText(props.token);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 1500);
  } catch {
    copied.value = false;
  }
};
</script>

<template>
  <section class="pg-card" :aria-label="label">
    <div class="pg-card-head">
      <div>
        <h2>{{ label }}</h2>
        <div class="pg-hook-sig">{{ source }}</div>
      </div>
      <div class="pg-row">
        <button type="button" class="pg-btn" data-size="sm" :disabled="!token" @click="revealed = !revealed">
          {{ revealed ? 'Hide' : 'Reveal' }}
        </button>
        <button type="button" class="pg-btn" data-size="sm" :disabled="!token" @click="copy()">
          {{ copied ? 'Copied' : 'Copy' }}
        </button>
      </div>
    </div>
    <div class="pg-card-body">
      <div class="pg-token" :data-masked="!revealed">{{ shown }}</div>
    </div>
    <p v-if="token && !decoded" class="pg-empty">Opaque token: not a JWT, nothing to decode.</p>
    <template v-if="decoded">
      <div class="pg-section-label">Header</div>
      <ClaimsTable :claims="decoded.header" :now="now" />
      <div class="pg-section-label">Payload</div>
      <ClaimsTable :claims="decoded.payload" :now="now" />
    </template>
  </section>
</template>
