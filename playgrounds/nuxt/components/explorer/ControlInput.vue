<script setup lang="ts">
// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import type {ArgValue, PropControl} from '~/lib/storyTypes';

const props = defineProps<{control: PropControl; value: ArgValue | undefined}>();
const emit = defineEmits<{change: [value: ArgValue]}>();

const onInput = (event: Event): void => {
  const raw: string = (event.target as HTMLInputElement).value;

  emit('change', props.control.control === 'number' ? Number(raw) : raw);
};
</script>

<template>
  <button
    v-if="control.control === 'bool'"
    type="button"
    role="switch"
    class="pg-switch"
    :aria-checked="value === true"
    :aria-label="control.name"
    @click="emit('change', value !== true)"
  >
    <span />
  </button>
  <input
    v-else-if="control.control === 'text' || control.control === 'number'"
    class="pg-input"
    :type="control.control === 'number' ? 'number' : 'text'"
    :aria-label="control.name"
    :value="String(value ?? '')"
    @input="onInput"
  />
  <div v-else role="radiogroup" :aria-label="control.name" class="pg-options">
    <button
      v-for="option in control.control"
      :key="option"
      type="button"
      role="radio"
      :aria-checked="value === option"
      @click="emit('change', option)"
    >
      {{ option }}
    </button>
  </div>
</template>
