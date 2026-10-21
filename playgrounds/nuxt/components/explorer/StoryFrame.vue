<script setup lang="ts">
// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {onErrorCaptured, ref, type Ref, type VNode} from 'vue';
import {logEvent} from '~/lib/events';

defineProps<{render: () => VNode}>();

const error: Ref<string | null> = ref<string | null>(null);

// Keeps a throwing story from taking down the whole explorer.
onErrorCaptured((caught: unknown) => {
  error.value = caught instanceof Error ? caught.message : String(caught);
  logEvent('story:error', error.value, 'error');

  return false;
});
</script>

<template>
  <div v-if="error" class="pg-warning" role="alert">This story threw: {{ error }}</div>
  <component :is="render" v-else />
</template>
