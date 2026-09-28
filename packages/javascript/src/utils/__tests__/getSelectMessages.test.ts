// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {describe, expect, it, vi} from 'vitest';
import getSelectMessages from '../getSelectMessages';

describe('getSelectMessages', () => {
  it('speaks English when there is no translate function', () => {
    const messages = getSelectMessages();

    expect(messages.loadMore).toBe('Load more');
    expect(messages.loading).toBe('Loading…');
    expect(messages.loadingMore).toBe('Loading more…');
  });

  it('uses what the translate function returns', () => {
    const translate = vi.fn((key: string) => `translated:${key}`);

    const messages = getSelectMessages(translate);

    expect(messages.loadMore).toBe('translated:elements.fields.select.load_more');
    expect(messages.loadingMore).toBe('translated:elements.fields.select.loading_more');
  });

  it('falls back to English for a key the translate function does not know', () => {
    const messages = getSelectMessages((key: string) => key);

    expect(messages.loadMore).toBe('Load more');
  });

  it('falls back to English when the translate function returns nothing', () => {
    const messages = getSelectMessages((() => '') as never);

    expect(messages.loading).toBe('Loading…');
  });
});
