// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

/**
 * GET /api/playground/source?file=server/api/playground/session.get.ts
 *
 * Returns the source of one of the playground's own handlers, for the Server page. Nuxt does not let
 * the Vue part of the app import from `server/`, so the files ship as Nitro server assets.
 */
const MOUNTS: [string, string][] = [
  ['server/', 'assets:playground-server'],
  ['pages/protected/', 'assets:playground-pages'],
];

export default defineEventHandler(async (event): Promise<string> => {
  const query: unknown = getQuery(event).file;
  const file: string = typeof query === 'string' ? query : '';
  const mount: [string, string] | undefined = MOUNTS.find(([prefix]: [string, string]) => file.startsWith(prefix));

  if (!mount || file.includes('..')) {
    throw createError({statusCode: 404, statusMessage: 'Unknown source file.'});
  }

  const source: unknown = await useStorage(mount[1]).getItem(file.slice(mount[0].length).replace(/\//g, ':'));

  if (source === null || source === undefined) {
    throw createError({statusCode: 404, statusMessage: 'Unknown source file.'});
  }

  setResponseHeader(event, 'content-type', 'text/plain; charset=utf-8');

  return typeof source === 'string' ? source : new TextDecoder().decode(source as Uint8Array);
});
