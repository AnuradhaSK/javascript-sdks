// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {afterEach, describe, expect, it, vi} from 'vitest';
import copyTextToClipboard from '../copyTextToClipboard';

describe('copyTextToClipboard', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    Reflect.deleteProperty(navigator, 'clipboard');
  });

  it('uses the Clipboard API when it is there', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {configurable: true, value: {writeText}});

    await copyTextToClipboard('secret-value');

    expect(writeText).toHaveBeenCalledWith('secret-value');
  });

  it('falls back to a textarea when the Clipboard API refuses', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {writeText: vi.fn().mockRejectedValue(new Error('denied'))},
    });
    const execCommand = vi.fn().mockReturnValue(true);
    Object.defineProperty(document, 'execCommand', {configurable: true, value: execCommand});

    await copyTextToClipboard('secret-value');

    expect(execCommand).toHaveBeenCalledWith('copy');
    expect(document.querySelector('textarea')).toBeNull();
  });

  it('falls back to a textarea when there is no Clipboard API', async () => {
    const execCommand = vi.fn().mockReturnValue(true);
    Object.defineProperty(document, 'execCommand', {configurable: true, value: execCommand});

    await expect(copyTextToClipboard('secret-value')).resolves.toBeUndefined();

    expect(execCommand).toHaveBeenCalledWith('copy');
  });
});
