<script setup lang="ts">
// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {definePageMeta} from '#imports';

// The named `auth` route middleware that @thunderid/nuxt registers: signed-out visitors go to
// /api/auth/signin?returnTo=/protected.
definePageMeta({middleware: ['auth']});
</script>

<template>
  <main class="pg-main">
    <ProtectedNotice
      title="Protected page"
      api="definePageMeta({middleware: ['auth']})"
      detail="The named auth middleware let you in because the hydrated auth state says you are signed in."
    />
  </main>
</template>
