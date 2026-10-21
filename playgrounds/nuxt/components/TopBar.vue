<script setup lang="ts">
// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {computed, onMounted, type ComputedRef} from 'vue';
import {useRoute, useRuntimeConfig, useThunderID} from '#imports';
import {checkServerHealth, health} from '~/lib/health';
import {getDisplayName, getInitials} from '~/lib/user';

const NAV: [string, string][] = [
  ['/', 'Overview'],
  ['/components', 'Components'],
  ['/composables', 'Composables'],
  ['/server', 'Server'],
];

const {isSignedIn, user} = useThunderID();
const route = useRoute();
const host: string = String(useRuntimeConfig().public.thunderid.baseUrl ?? '(not set)').replace(/^https?:\/\//, '');

const userRecord: ComputedRef<Record<string, unknown> | null> = computed(
  () => (user.value as Record<string, unknown> | null) ?? null,
);

const isActive = (path: string): boolean => (path === '/' ? route.path === '/' : route.path.startsWith(path));

onMounted(() => {
  void checkServerHealth();
});
</script>

<template>
  <header class="pg-topbar">
    <div class="pg-brand">
      <img src="/thunderid-logo.svg" alt="ThunderID" height="22" width="102" />
      <span class="pg-brand-divider" aria-hidden="true" />
      <NuxtLogo />
      <strong>Nuxt Playground</strong>
    </div>
    <nav aria-label="Playground sections" class="pg-nav">
      <NuxtLink v-for="[path, label] in NAV" :key="path" :to="path" :aria-current="isActive(path) ? 'page' : undefined">
        {{ label }}
      </NuxtLink>
    </nav>
    <div class="pg-spacer" />
    <span class="pg-server" :title="health.detail">
      <span class="pg-dot" :data-state="health.state" />
      {{ host }}
    </span>
    <div
      class="pg-avatar"
      :data-anon="!isSignedIn"
      role="img"
      :aria-label="isSignedIn ? `Signed in as ${getDisplayName(userRecord)}` : 'Signed out'"
    >
      {{ isSignedIn ? getInitials(userRecord) : '?' }}
    </div>
  </header>
</template>
