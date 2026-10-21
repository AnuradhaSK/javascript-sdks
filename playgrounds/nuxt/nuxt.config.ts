// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

export default defineNuxtConfig({
  app: {
    head: {
      link: [
        {href: '/favicon.svg', rel: 'icon', type: 'image/svg+xml'},
        {href: 'https://fonts.googleapis.com', rel: 'preconnect'},
        {
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap',
          rel: 'stylesheet',
        },
      ],
      title: 'ThunderID Nuxt Playground',
    },
  },
  compatibilityDate: '2025-07-15',
  css: ['~/assets/styles.css'],
  devServer: {port: 3002},
  // The Nuxt DevTools overlay would sit on top of the playground's own panels.
  devtools: {enabled: false},
  modules: ['@thunderid/nuxt'],
  nitro: {
    // The Server page shows the source of the playground's handlers, served by /api/playground/source.
    serverAssets: [
      {baseName: 'playground-server', dir: './'},
      {baseName: 'playground-pages', dir: '../pages/protected'},
    ],
  },
  thunderid: {
    // Serves POST /api/auth/backchannel-logout, so ending the session in ThunderID ends it here too.
    backchannelLogout: {enabled: true},
    // Serves the picker routes and registers UserSelect, AuthFlowSelect and UserTypeSelect for the explorer.
    resourcePickers: {authFlows: true, userTypes: true, users: true},
    scopes: ['openid', 'profile', 'email'],
  },
});
