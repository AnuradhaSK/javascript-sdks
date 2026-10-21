<script setup lang="ts">
// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {inspect} from '../lib/inspect';

defineProps<{name: string; signature: string; value: unknown}>();
</script>

<template>
  <section class="pg-card" :aria-label="name">
    <div class="pg-card-head">
      <div>
        <h2 class="pg-mono">{{ name }}</h2>
        <div class="pg-hook-sig">{{ signature }}</div>
      </div>
      <div v-if="$slots['actions']" class="pg-row">
        <slot name="actions" />
      </div>
    </div>
    <slot />
    <pre class="pg-json">{{ inspect(value) }}</pre>
  </section>
</template>
