#!/usr/bin/env node
// Reproducible build of the vendored Rive runtime for WeChat.
//
//   npm pack @rive-app/canvas-advanced@<version>
//     -> extract canvas_advanced.mjs + rive.wasm
//     -> patch glue (tools/lib/patch-glue.mjs)
//     -> brotli-compress wasm  (WeChat ships .wasm.br; ~1.85MB -> ~0.55MB)
//     -> emit into packages/rive-weapp/vendor/ (then `npm run sync` -> demos)
//
// This is the ONLY step that touches upstream Rive. Re-run it to upgrade Rive:
//   1. bump `version` in package.json -> riveRuntime.version
//   2. npm run build:runtime
//   3. re-run the smoke test (npm test)

import { execFileSync } from 'node:child_process';
import { brotliCompressSync, constants } from 'node:zlib';
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  rmSync,
  readdirSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { patchGlue } from './lib/patch-glue.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PKG = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
const PACKAGE_NAME = PKG.riveRuntime.package;
const VERSION = PKG.riveRuntime.version;
const VENDOR_DIR = join(ROOT, 'packages', 'rive-weapp', 'vendor');

const log = (...a) => console.log('[build-runtime]', ...a);

function packAndExtract() {
  const tmp = mkdtempSync(join(tmpdir(), 'rive-pack-'));
  log(`npm pack ${PACKAGE_NAME}@${VERSION} -> ${tmp}`);
  const out = execFileSync(
    'npm',
    ['pack', `${PACKAGE_NAME}@${VERSION}`, '--pack-destination', tmp, '--silent'],
    { cwd: tmp, encoding: 'utf8' },
  );
  const tgz = readdirSync(tmp).find((f) => f.endsWith('.tgz'));
  if (!tgz) throw new Error('npm pack produced no tarball:\n' + out);
  execFileSync('tar', ['xzf', join(tmp, tgz), '-C', tmp]);
  return { dir: join(tmp, 'package'), cleanup: () => rmSync(tmp, { recursive: true, force: true }) };
}

function main() {
  mkdirSync(VENDOR_DIR, { recursive: true });
  const { dir, cleanup } = packAndExtract();
  try {
    // 1) Glue
    const glueSrc = readFileSync(join(dir, 'canvas_advanced.mjs'), 'utf8');
    const patched = patchGlue(glueSrc, { packageName: PACKAGE_NAME, version: VERSION });
    writeFileSync(join(VENDOR_DIR, 'rive.glue.js'), patched);
    log(`glue   -> rive.glue.js (${patched.length.toLocaleString()} bytes)`);

    // 2) WASM -> brotli
    const wasm = readFileSync(join(dir, 'rive.wasm'));
    const br = brotliCompressSync(wasm, {
      params: {
        [constants.BROTLI_PARAM_QUALITY]: 11,
        [constants.BROTLI_PARAM_SIZE_HINT]: wasm.length,
      },
    });
    writeFileSync(join(VENDOR_DIR, 'rive.wasm.br'), br);
    const pct = ((br.length / wasm.length) * 100).toFixed(1);
    log(
      `wasm   -> rive.wasm.br (${(wasm.length / 1048576).toFixed(2)}MB -> ` +
        `${(br.length / 1048576).toFixed(2)}MB, ${pct}%)`,
    );
    if (br.length > 2 * 1024 * 1024) {
      console.warn('[build-runtime] WARNING: rive.wasm.br exceeds the 2MB WeChat subpackage limit.');
    }

    // 3) Provenance
    writeFileSync(
      join(VENDOR_DIR, 'VERSION.json'),
      JSON.stringify({ package: PACKAGE_NAME, version: VERSION, builtFrom: 'canvas_advanced.mjs' }, null, 2) + '\n',
    );
    log('done.');
  } finally {
    cleanup();
  }
}

main();
