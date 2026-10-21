<script setup lang="ts">
// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {computed, ComputedRef} from 'vue';
import TopBar from './components/TopBar.vue';
import {useSdkObserver} from './lib/observer';
import {hashPath, Section} from './lib/router';
import Composables from './pages/Composables.vue';
import Explorer from './pages/explorer/Explorer.vue';
import Overview from './pages/Overview.vue';
import Tokens from './pages/Tokens.vue';

useSdkObserver();

const section: ComputedRef<Section> = computed(() => {
  const first: string | undefined = hashPath.value[0];

  return first === 'components' || first === 'composables' || first === 'tokens' ? first : 'overview';
});
</script>

<template>
  <div class="pg-app">
    <TopBar :section="section" />
    <Overview v-if="section === 'overview'" />
    <Explorer v-else-if="section === 'components'" :component-id="hashPath[1] ?? ''" :story-id="hashPath[2] ?? ''" />
    <Composables v-else-if="section === 'composables'" />
    <Tokens v-else />
  </div>
</template>
