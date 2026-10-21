<script setup lang="ts">
// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

type IconName =
  | 'bang'
  | 'check'
  | 'chevron'
  | 'copy'
  | 'cross'
  | 'dash'
  | 'desktop'
  | 'grid'
  | 'grid-bg'
  | 'mobile'
  | 'moon'
  | 'play'
  | 'search'
  | 'spinner'
  | 'sun'
  | 'tablet';

const props = withDefaults(defineProps<{name: IconName; size?: number}>(), {size: 14});

const strokeWidth: Record<string, number> = {bang: 3, check: 3, chevron: 2.5, cross: 3, dash: 3, spinner: 2.5};
</script>

<template>
  <svg
    v-if="props.name === 'play'"
    :width="props.size"
    :height="props.size"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <polygon points="6 4 20 12 6 20 6 4" />
  </svg>
  <svg
    v-else
    :class="{'pg-spin': props.name === 'spinner'}"
    :width="props.size"
    :height="props.size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="strokeWidth[props.name] ?? 2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path v-if="props.name === 'spinner'" d="M21 12a9 9 0 11-6.2-8.56" />
    <polyline v-else-if="props.name === 'check'" points="20 6 9 17 4 12" />
    <template v-else-if="props.name === 'cross'">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </template>
    <line v-else-if="props.name === 'dash'" x1="5" y1="12" x2="19" y2="12" />
    <template v-else-if="props.name === 'bang'">
      <line x1="12" y1="6" x2="12" y2="13" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </template>
    <template v-else-if="props.name === 'search'">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </template>
    <polyline v-else-if="props.name === 'chevron'" points="9 18 15 12 9 6" />
    <template v-else-if="props.name === 'grid'">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </template>
    <template v-else-if="props.name === 'desktop'">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </template>
    <template v-else-if="props.name === 'tablet'">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </template>
    <template v-else-if="props.name === 'mobile'">
      <rect x="6" y="2" width="12" height="20" rx="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </template>
    <path v-else-if="props.name === 'moon'" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    <template v-else-if="props.name === 'sun'">
      <circle cx="12" cy="12" r="4" />
      <path
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
      />
    </template>
    <template v-else-if="props.name === 'grid-bg'">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="3" y1="15" x2="21" y2="15" />
      <line x1="9" y1="3" x2="9" y2="21" />
      <line x1="15" y1="3" x2="15" y2="21" />
    </template>
    <template v-else-if="props.name === 'copy'">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </template>
  </svg>
</template>
