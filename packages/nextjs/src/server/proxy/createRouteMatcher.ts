// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {NextRequest} from 'next/server';

/**
 * Creates a route matcher function that tests if a request matches any of the given patterns.
 *
 * @param patterns - Array of route patterns to match. Supports glob-like patterns.
 * @returns Function that tests if a request matches any of the patterns
 *
 * @example
 * ```typescript
 * const isProtectedRoute = createRouteMatcher([
 *   '/dashboard(.*)',
 *   '/admin(.*)',
 *   '/profile'
 * ]);
 *
 * if (isProtectedRoute(req)) {
 *   // Route is protected
 * }
 * ```
 */
/**
 * Converts one route pattern to a regular expression source. A parenthesized group such as `(.*)` is kept as
 * regex, so `/dashboard(.*)` matches `/dashboard` and everything under it. Outside a group a `.` is a literal dot
 * and a `*` matches any run of characters.
 */
const toRegexSource = (pattern: string): string => {
  let source = '';
  let depth = 0;

  for (const char of pattern) {
    if (char === '(') {
      depth += 1;
      source += char;
    } else if (char === ')') {
      depth = Math.max(depth - 1, 0);
      source += char;
    } else if (depth > 0) {
      source += char;
    } else if (char === '.') {
      source += '\\.';
    } else if (char === '*') {
      source += '.*';
    } else {
      source += char;
    }
  }

  return source;
};

const createRouteMatcher = (patterns: string[]): ((req: NextRequest) => boolean) => {
  const regexPatterns: RegExp[] = patterns.map((pattern: string): RegExp => new RegExp(`^${toRegexSource(pattern)}$`));

  return (req: NextRequest): boolean => {
    const {pathname} = req.nextUrl;
    return regexPatterns.some((regex: RegExp): boolean => regex.test(pathname));
  };
};

export default createRouteMatcher;
