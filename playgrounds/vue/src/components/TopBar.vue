<script setup lang="ts">
// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ThunderIDContext, useThunderID} from '@thunderid/vue';
import {computed, ComputedRef, onMounted} from 'vue';
import {Logo, VueLogo} from './icons';
import playgroundConfig from '../config';
import {checkServerHealth, serverHealth} from '../lib/health';
import {href, Section} from '../lib/router';
import {SdkUser, toUser} from '../lib/sdk';
import {getDisplayName, getInitials} from '../lib/user';

defineProps<{section: Section}>();

const NAV: [Section, string, string][] = [
  ['overview', 'Overview', '#/'],
  ['components', 'Components', href('components')],
  ['composables', 'Composables', href('composables')],
  ['tokens', 'Tokens', href('tokens')],
];

const sdk: ThunderIDContext = useThunderID();
const user: ComputedRef<SdkUser | null> = computed(() => toUser(sdk.user.value));
const host: string = playgroundConfig.baseUrl.replace(/^https?:\/\//, '');

onMounted(() => {
  void checkServerHealth();
});
</script>

<template>
  <header class="pg-topbar">
    <div class="pg-brand">
      <Logo />
      <span class="pg-brand-divider" aria-hidden="true" />
      <VueLogo />
      <strong>Vue Playground</strong>
    </div>
    <nav aria-label="Playground sections" class="pg-nav">
      <a
        v-for="[id, label, target] in NAV"
        :key="id"
        :href="target"
        :aria-current="section === id ? 'page' : undefined"
        >{{ label }}</a
      >
    </nav>
    <div class="pg-spacer" />
    <span class="pg-server" :title="serverHealth.detail">
      <span class="pg-dot" :data-state="serverHealth.state" />
      {{ host }}
    </span>
    <div
      class="pg-avatar"
      :data-anon="!sdk.isSignedIn.value"
      role="img"
      :aria-label="sdk.isSignedIn.value ? `Signed in as ${getDisplayName(user)}` : 'Signed out'"
    >
      {{ sdk.isSignedIn.value ? getInitials(user) : '?' }}
    </div>
  </header>
</template>
