<script setup lang="ts">
// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useRequestEvent, useState} from '#imports';
import type {SsrSnapshot} from '~/lib/types';

// What the ThunderID Nitro plugin put on `event.context` for this server render, recorded by
// server/middleware/playground.ts and handed to the client in the Nuxt payload.
useState<SsrSnapshot | null>('playground:ssr', () =>
  import.meta.server
    ? (((useRequestEvent()?.context as Record<string, unknown> | undefined)?.playgroundSsr as SsrSnapshot) ?? null)
    : null,
);
</script>

<template>
  <ThunderIDRoot>
    <div class="pg-app">
      <SdkObserver />
      <TopBar />
      <NuxtPage />
    </div>
  </ThunderIDRoot>
</template>
