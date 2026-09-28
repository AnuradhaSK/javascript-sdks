// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

/**
 * Copies text to the clipboard. It uses the Clipboard API, and falls back to a hidden textarea and
 * `document.execCommand('copy')` where the API is missing or refuses, such as on a page without a secure context.
 *
 * @param text - The text to copy.
 */
const copyTextToClipboard = async (text: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const textArea: HTMLTextAreaElement = document.createElement('textarea');

    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  }
};

export default copyTextToClipboard;
