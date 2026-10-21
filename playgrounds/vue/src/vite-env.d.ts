// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

/// <reference types="vite/client" />

// Types `.vue` imports for tools that run plain TypeScript, such as ESLint. vue-tsc resolves the real files.
declare module '*.vue' {
  import type {DefineComponent} from 'vue';

  const component: DefineComponent;
  export default component;
}
