// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

/**
 * Fetches the JavaScript quickstarts from thunder-id/samples into `tests/e2e/.samples/` and wires
 * them to this repository's own SDK packages, so the E2E suite exercises the change under test
 * rather than the published release each quickstart depends on.
 *
 * Each package under `packages/` is packed with `pnpm pack` (which is why `pnpm build` must run
 * first), and every `@thunderid/*` dependency in a quickstart, direct or transitive, is pinned to
 * the resulting tarball through a pnpm override. The quickstarts install exactly as an adopter's
 * app would, from packed tarballs, instead of linking into the workspace.
 *
 * Environment:
 *   THUNDERID_SAMPLES_DIR   Use this local samples checkout instead of cloning (copied, never modified).
 *   THUNDERID_SAMPLES_REPO  Repository to clone (default: https://github.com/thunder-id/samples.git).
 *   THUNDERID_SAMPLES_REF   Branch or tag to clone (default: main).
 *
 * Usage: node tests/e2e/scripts/prepare-samples.ts (Node.js 22.18+ runs TypeScript directly)
 */

import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const QUICKSTARTS = ['browser', 'express', 'nextjs', 'node', 'nuxt', 'react', 'vue'];

const projectRoot = path.resolve(import.meta.dirname, '../../..');
const samplesHome = path.resolve(import.meta.dirname, '../.samples');
const packsDir = path.join(samplesHome, '.packs');

/** Reads an environment variable, treating an empty value (e.g. an unset CI input) as unset. */
function env(name: string, fallback: string): string {
  const value = process.env[name];
  return value !== undefined && value !== '' ? value : fallback;
}

function run(command: string, args: string[], cwd?: string): void {
  execFileSync(command, args, {cwd, stdio: 'inherit'});
}

function resolveSource(): {cleanup?: () => void; dir: string} {
  if (process.env.THUNDERID_SAMPLES_DIR) {
    return {dir: path.resolve(process.env.THUNDERID_SAMPLES_DIR)};
  }

  const repo = env('THUNDERID_SAMPLES_REPO', 'https://github.com/thunder-id/samples.git');
  const ref = env('THUNDERID_SAMPLES_REF', 'main');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'thunderid-samples-'));
  console.log(`Cloning ${repo} (${ref})...`);
  run('git', ['clone', '--depth', '1', '--branch', ref, repo, dir]);

  return {cleanup: () => fs.rmSync(dir, {force: true, recursive: true}), dir};
}

function packPackages(): Record<string, string> {
  fs.mkdirSync(packsDir, {recursive: true});
  const tarballs: Record<string, string> = {};

  for (const entry of fs.readdirSync(path.join(projectRoot, 'packages'))) {
    const pkgDir = path.join(projectRoot, 'packages', entry);
    const manifest = path.join(pkgDir, 'package.json');
    if (!fs.existsSync(manifest)) continue;

    const pkg = JSON.parse(fs.readFileSync(manifest, 'utf8')) as {name: string; private?: boolean};
    if (pkg.private) continue;

    const before = new Set(fs.readdirSync(packsDir));
    run('pnpm', ['pack', '--pack-destination', packsDir], pkgDir);
    const tarball = fs.readdirSync(packsDir).find((file) => file.endsWith('.tgz') && !before.has(file));
    if (!tarball) throw new Error(`pnpm pack produced no tarball for ${pkg.name}`);

    tarballs[pkg.name] = `file:${path.join(packsDir, tarball)}`;
  }

  return tarballs;
}

/** Adds an `overrides` entry per packed package to the quickstart's own pnpm-workspace.yaml. */
function overrideWithTarballs(sampleDir: string, tarballs: Record<string, string>): void {
  const workspaceFile = path.join(sampleDir, 'pnpm-workspace.yaml');
  const lines = fs.existsSync(workspaceFile) ? fs.readFileSync(workspaceFile, 'utf8').split('\n') : [];
  const entries = Object.entries(tarballs).map(([name, spec]) => `  '${name}': '${spec}'`);

  const overridesAt = lines.findIndex((line) => line.trimEnd() === 'overrides:');
  if (overridesAt === -1) {
    lines.push('', 'overrides:', ...entries, '');
  } else {
    lines.splice(overridesAt + 1, 0, ...entries);
  }

  fs.writeFileSync(workspaceFile, lines.join('\n'));
}

const source = resolveSource();

try {
  fs.rmSync(samplesHome, {force: true, recursive: true});
  const tarballs = packPackages();

  for (const name of QUICKSTARTS) {
    const from = path.join(source.dir, 'quickstarts', name);
    if (!fs.existsSync(from)) throw new Error(`quickstarts/${name} not found in ${source.dir}`);

    const to = path.join(samplesHome, 'quickstarts', name);
    fs.cpSync(from, to, {
      filter: (src) => !['node_modules', '.env', 'dist', '.next', '.nuxt', '.output'].includes(path.basename(src)),
      recursive: true,
    });

    overrideWithTarballs(to, tarballs);
    console.log(`Installing quickstarts/${name} against the local SDK packages...`);
    // The samples repo's lockfile pins the published releases, which the overrides replace.
    run('pnpm', ['install', '--no-frozen-lockfile'], to);
  }
} finally {
  source.cleanup?.();
}
