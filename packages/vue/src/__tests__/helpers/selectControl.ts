// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import type {VueWrapper} from '@vue/test-utils';

const CONTROL = 'select';

/** Where the select under test is, how to read its shown label, and how to choose an option. */
export const findSelectControl = (wrapper: Pick<VueWrapper, 'find'>) => wrapper.find(CONTROL);

export const findAllSelectControls = (wrapper: Pick<VueWrapper, 'findAll'>) => wrapper.findAll(CONTROL);

export const readSelectedLabel = (control: {element: Element}): string =>
  (control.element as HTMLSelectElement).selectedOptions[0]?.textContent?.trim() ?? '';

export const chooseOption = async (
  control: {element: Element; setValue: (value: string) => Promise<void>},
  optionLabel: string,
): Promise<void> => {
  const option: HTMLOptionElement | undefined = Array.from((control.element as HTMLSelectElement).options).find(
    (candidate: HTMLOptionElement) => candidate.textContent?.trim() === optionLabel,
  );

  if (!option) {
    throw new Error(`No option labelled "${optionLabel}"`);
  }

  await control.setValue(option.value);
};
