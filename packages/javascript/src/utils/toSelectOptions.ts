// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import toSelectOption from './toSelectOption';
import type {SelectOption, SelectOptionDefaults, SelectOptionMapping} from '../models/select';

const toSelectOptions = <T = unknown>(
  items: (T | string | number)[],
  mapping?: SelectOptionMapping<T>,
  defaults?: SelectOptionDefaults,
): SelectOption[] =>
  items
    .map((item: T | string | number) => toSelectOption(item, mapping, defaults))
    .filter((option: SelectOption | null): option is SelectOption => option !== null);

export default toSelectOptions;
