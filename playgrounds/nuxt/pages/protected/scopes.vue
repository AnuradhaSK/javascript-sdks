<script setup lang="ts">
// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {definePageMeta, defineThunderIDMiddleware} from '#imports';

// A route middleware built with the module's factory, gated on scopes the playground requests.
definePageMeta({middleware: [defineThunderIDMiddleware({requireScopes: ['openid', 'profile']})]});
</script>

<template>
  <main class="pg-main">
    <ProtectedNotice
      title="Scope-gated page"
      api="defineThunderIDMiddleware({requireScopes: ['openid', 'profile']})"
      detail="The middleware found every required scope, so the page rendered."
    />
  </main>
</template>
