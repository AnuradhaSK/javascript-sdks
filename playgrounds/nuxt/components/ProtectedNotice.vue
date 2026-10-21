<script setup lang="ts">
// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

defineProps<{api: string; detail: string; title: string}>();
</script>

<template>
  <div class="pg-heading">
    <div>
      <h1>{{ title }}</h1>
      <p>
        <span class="pg-accent pg-mono">{{ api }}</span>
      </p>
    </div>
  </div>
  <section class="pg-card" aria-label="Result">
    <div class="pg-card-body">
      <span class="pg-pill" data-state="ok">Allowed</span>
      <p>{{ detail }}</p>
      <div class="pg-row">
        <NuxtLink class="pg-btn" to="/server">Back to the Server page</NuxtLink>
      </div>
    </div>
  </section>
</template>
