// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ThunderIDPlugin} from '@thunderid/vue';
import {createApp} from 'vue';
import App from './App.vue';
import './styles.css';

createApp(App).use(ThunderIDPlugin).mount('#app');
