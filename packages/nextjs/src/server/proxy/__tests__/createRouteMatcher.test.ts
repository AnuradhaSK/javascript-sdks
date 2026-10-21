// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {NextRequest} from 'next/server';
import {describe, expect, it} from 'vitest';
import createRouteMatcher from '../createRouteMatcher';

const request = (pathname: string): NextRequest => ({nextUrl: {pathname}}) as unknown as NextRequest;

describe('createRouteMatcher', () => {
  it.each([
    ['/dashboard(.*)', '/dashboard'],
    ['/dashboard(.*)', '/dashboard/'],
    ['/dashboard(.*)', '/dashboard/settings'],
    ['/dashboard(.*)', '/dashboard/a/b/c'],
    ['/admin(.*)', '/admin/users'],
    ['/settings(.*)', '/settings/profile'],
    ['/api/private(.*)', '/api/private'],
    ['/api/private(.*)', '/api/private/data'],
  ])('matches the documented pattern %s against %s', (pattern: string, pathname: string) => {
    expect(createRouteMatcher([pattern])(request(pathname))).toBe(true);
  });

  it.each([
    ['/dashboard(.*)', '/'],
    ['/dashboard(.*)', '/other/dashboard'],
    ['/api/private(.*)', '/api/public/data'],
  ])('does not match the documented pattern %s against %s', (pattern: string, pathname: string) => {
    expect(createRouteMatcher([pattern])(request(pathname))).toBe(false);
  });

  it('matches an exact path only', () => {
    const isProfile = createRouteMatcher(['/profile']);

    expect(isProfile(request('/profile'))).toBe(true);
    expect(isProfile(request('/profile/edit'))).toBe(false);
  });

  it('treats a dot outside a group as a literal dot', () => {
    const isFile = createRouteMatcher(['/robots.txt']);

    expect(isFile(request('/robots.txt'))).toBe(true);
    expect(isFile(request('/robotsXtxt'))).toBe(false);
  });

  it('treats a bare * as a wildcard', () => {
    const isProtected = createRouteMatcher(['/protected/*']);

    expect(isProtected(request('/protected/settings'))).toBe(true);
    expect(isProtected(request('/protected'))).toBe(false);
  });

  it('keeps other regex groups such as (.+) working', () => {
    const isUser = createRouteMatcher(['/users/(.+)']);

    expect(isUser(request('/users/42'))).toBe(true);
    expect(isUser(request('/users/'))).toBe(false);
  });

  it('matches when any of several patterns matches', () => {
    const isProtected = createRouteMatcher(['/dashboard(.*)', '/profile']);

    expect(isProtected(request('/profile'))).toBe(true);
    expect(isProtected(request('/dashboard/x'))).toBe(true);
    expect(isProtected(request('/public'))).toBe(false);
  });
});
