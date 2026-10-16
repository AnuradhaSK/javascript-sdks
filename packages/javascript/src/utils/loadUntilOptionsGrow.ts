// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import SelectConstants from '../constants/SelectConstants';

/**
 * Loads batches until one adds something new, the data ends, or a few empty batches in a row have been skipped.
 *
 * A batch that adds nothing new while more remain would leave the list empty or stuck, so a request for more
 * options would appear to do nothing. So the loading helper keeps going, a few batches at most.
 *
 * @param loadBatch - Loads the next batch.
 * @param applyBatch - Adds a batch to the list. Returns `true` when it added nothing while more remain.
 * @param isCurrent - Returns `false` once the list was reset or the helper went away, which stops the loop.
 *
 * @internal Shared by the SDK packages. It is not part of the public API and can change in any release.
 */
const loadUntilOptionsGrow = async <TBatch>(
  loadBatch: () => Promise<TBatch>,
  applyBatch: (batch: TBatch) => boolean,
  isCurrent: () => boolean,
): Promise<void> => {
  for (let emptyBatches = 0; emptyBatches <= SelectConstants.MAX_EMPTY_CONTINUATIONS; emptyBatches += 1) {
    const batch: TBatch = await loadBatch();

    if (!isCurrent() || !applyBatch(batch)) {
      return;
    }
  }
};

export default loadUntilOptionsGrow;
