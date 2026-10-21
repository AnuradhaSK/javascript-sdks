// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

/**
 * Serializes hook values for display: functions become signatures, long strings are shortened, and
 * deep or circular structures are cut off.
 */
export const inspect = (value: unknown, maxDepth = 4): string => {
  const seen = new WeakSet<object>();

  const walk = (current: unknown, depth: number): unknown => {
    if (typeof current === 'function') return `ƒ ${current.name || 'anonymous'}()`;
    if (typeof current === 'string') return current.length > 120 ? `${current.slice(0, 117)}…` : current;
    if (current === null || typeof current !== 'object') return current;
    if (seen.has(current)) return '[circular]';
    if (depth >= maxDepth) return Array.isArray(current) ? `[${current.length} items]` : '{…}';

    seen.add(current);

    if (Array.isArray(current)) return current.slice(0, 20).map((item: unknown) => walk(item, depth + 1));

    return Object.fromEntries(
      Object.entries(current as Record<string, unknown>).map(([key, item]: [string, unknown]) => [
        key,
        walk(item, depth + 1),
      ]),
    );
  };

  return JSON.stringify(walk(value, 0), null, 2) ?? 'undefined';
};
