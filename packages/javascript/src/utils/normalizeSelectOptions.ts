// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import type {SelectOption, SelectOptionInput} from '../models/select';

const asText = (raw: unknown): string | undefined => {
  if (typeof raw === 'string') {
    return raw.trim() === '' ? undefined : raw;
  }

  return typeof raw === 'number' && Number.isFinite(raw) ? String(raw) : undefined;
};

const normalizeSelectOption = (input: SelectOptionInput | null | undefined): SelectOption | null => {
  if (typeof input === 'object' && input !== null) {
    const value: string | undefined = asText(input.value);

    if (value === undefined) {
      return null;
    }

    return {label: asText(input.label) ?? value, value, ...(input.disabled === true ? {disabled: true} : {})};
  }

  const text: string | undefined = asText(input);

  return text === undefined ? null : {label: text, value: text};
};

/**
 * Turns the options a caller wrote into the list a select renders. Strings and numbers stand for
 * themselves, objects set `label` and `value`, and empty or missing entries are skipped. Objects of any
 * other shape are not guessed at: map them with {@link toSelectOptions} first.
 */
const normalizeSelectOptions = (inputs?: readonly (SelectOptionInput | null | undefined)[] | null): SelectOption[] =>
  (inputs ?? [])
    .map(normalizeSelectOption)
    .filter((option: SelectOption | null): option is SelectOption => option !== null);

export default normalizeSelectOptions;
