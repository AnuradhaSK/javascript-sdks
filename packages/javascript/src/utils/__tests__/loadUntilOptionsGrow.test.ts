// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {describe, expect, it, vi} from 'vitest';
import SelectConstants from '../../constants/SelectConstants';
import loadUntilOptionsGrow from '../loadUntilOptionsGrow';

describe('loadUntilOptionsGrow', () => {
  it('stops after the first batch when it grew the list', async () => {
    const loadBatch = vi.fn().mockResolvedValue('batch');
    const applyBatch = vi.fn().mockReturnValue(false);

    await loadUntilOptionsGrow(loadBatch, applyBatch, () => true);

    expect(loadBatch).toHaveBeenCalledTimes(1);
    expect(applyBatch).toHaveBeenCalledWith('batch');
  });

  it('keeps going while batches add nothing and more remain', async () => {
    const loadBatch = vi.fn().mockResolvedValue('batch');
    const applyBatch = vi.fn().mockReturnValueOnce(true).mockReturnValueOnce(true).mockReturnValue(false);

    await loadUntilOptionsGrow(loadBatch, applyBatch, () => true);

    expect(loadBatch).toHaveBeenCalledTimes(3);
  });

  it('gives up after a few empty batches in a row', async () => {
    const loadBatch = vi.fn().mockResolvedValue('batch');

    await loadUntilOptionsGrow(
      loadBatch,
      () => true,
      () => true,
    );

    expect(loadBatch).toHaveBeenCalledTimes(SelectConstants.MAX_EMPTY_CONTINUATIONS + 1);
  });

  it('stops without applying a batch that arrives after the list was reset', async () => {
    const loadBatch = vi.fn().mockResolvedValue('late');
    const applyBatch = vi.fn().mockReturnValue(true);

    await loadUntilOptionsGrow(loadBatch, applyBatch, () => false);

    expect(applyBatch).not.toHaveBeenCalled();
    expect(loadBatch).toHaveBeenCalledTimes(1);
  });

  it('lets a failed load reach the caller and stops', async () => {
    const loadBatch = vi.fn().mockResolvedValueOnce('batch').mockRejectedValue(new Error('down'));

    await expect(
      loadUntilOptionsGrow(
        loadBatch,
        () => true,
        () => true,
      ),
    ).rejects.toThrow('down');
    expect(loadBatch).toHaveBeenCalledTimes(2);
  });
});
