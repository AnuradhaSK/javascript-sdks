<script setup lang="ts">
// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {clearEvents, events} from '~/lib/events';
</script>

<template>
  <section aria-label="Events" class="pg-card">
    <div class="pg-card-head">
      <h2>SDK events</h2>
      <button type="button" class="pg-link-btn" @click="clearEvents">Clear</button>
    </div>
    <ol class="pg-events">
      <li v-for="event in events" :key="event.id">
        <span class="pg-ev-time">{{ event.time }}</span>
        <span class="pg-ev-name" :data-kind="event.kind">{{ event.name }}</span>
        <span class="pg-ev-detail" :title="event.detail">{{ event.detail }}</span>
      </li>
      <li v-if="events.length === 0" class="pg-empty">No events yet.</li>
    </ol>
  </section>
</template>
