// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

/**
 * Styles for the CopyableText primitive component.
 *
 * BEM block: `.thunderid-copyable-text`
 *
 * Elements:
 *   __label | __box | __value | __copy
 */
const COPYABLE_TEXT_CSS = `
/* ============================================================
   CopyableText
   ============================================================ */

.thunderid-copyable-text {
  display: flex;
  flex-direction: column;
  gap: calc(var(--thunderid-spacing-unit) * 0.5);
  width: 100%;
}

.thunderid-copyable-text__label {
  color: var(--thunderid-color-text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
}

.thunderid-copyable-text__box {
  display: flex;
  align-items: center;
  gap: calc(var(--thunderid-spacing-unit) * 1);
  padding: calc(var(--thunderid-spacing-unit) * 0.75) calc(var(--thunderid-spacing-unit) * 1);
  background-color: var(--thunderid-color-background-surface);
  border: 1px solid var(--thunderid-input-borderColor);
  border-radius: var(--thunderid-border-radius-small);
}

.thunderid-copyable-text__value {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  word-break: break-all;
  font-family: monospace;
  font-size: 0.85rem;
  color: var(--thunderid-color-text-primary);
}

.thunderid-copyable-text .thunderid-copyable-text__copy {
  flex-shrink: 0;
  padding: 0;
  width: var(--thunderid-button-sm-height);
  color: var(--thunderid-color-text-secondary);
}
.thunderid-copyable-text .thunderid-copyable-text__copy:hover {
  color: var(--thunderid-color-text-primary);
}
`;

export default COPYABLE_TEXT_CSS;
