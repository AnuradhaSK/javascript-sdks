// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import ResourcePickers from '../constants/ResourcePickers';
import type {ResourcePicker} from '../constants/ResourcePickers';
import type {ThunderIDNuxtConfig} from '../types';

/**
 * The management pickers the application has turned on. A picker is on only when its key is `true`, so with no
 * `resourcePickers` setting nothing is served.
 */
const getEnabledResourcePickers = (enabled?: ThunderIDNuxtConfig['resourcePickers']): ResourcePicker[] =>
  (Object.keys(ResourcePickers) as (keyof typeof ResourcePickers)[])
    .filter((key: keyof typeof ResourcePickers) => enabled?.[key] === true)
    .map((key: keyof typeof ResourcePickers) => ResourcePickers[key]);

export default getEnabledResourcePickers;
