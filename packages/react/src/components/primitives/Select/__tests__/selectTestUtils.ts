// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {fireEvent, screen} from '@testing-library/react';
import {expect} from 'vitest';

export const getSelectControl = (): HTMLSelectElement => screen.getByRole<HTMLSelectElement>('combobox');

export const getAllSelectControls = (): HTMLSelectElement[] => screen.getAllByRole<HTMLSelectElement>('combobox');

export const readSelectedLabel = (control: HTMLElement): string =>
  (control as HTMLSelectElement).selectedOptions[0]?.textContent ?? '';

export const chooseOption = (control: HTMLElement, optionLabel: string): void => {
  const option: HTMLOptionElement | undefined = Array.from((control as HTMLSelectElement).options).find(
    (candidate: HTMLOptionElement) => candidate.textContent === optionLabel,
  );

  if (!option) {
    throw new Error(`No option labelled "${optionLabel}"`);
  }

  fireEvent.change(control, {target: {value: option.value}});
};

export const changeEventWith = (value: string): unknown => {
  const target: unknown = expect.objectContaining({value});

  return expect.objectContaining({target});
};
