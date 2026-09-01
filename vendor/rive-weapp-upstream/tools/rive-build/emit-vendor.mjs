#!/usr/bin/env node
// Patch a freshly-built glue + brotli-compress its wasm into the vendor dir.
//   node emit-vendor.mjs <canvas_advanced.mjs> <canvas_advanced.wasm> <vendorDir>
// Used by build-lite-weapp.sh; reuses the same patch-glue as the npm-based build.

import { readFileSync, writeFileSync } from 'node:fs';
import { brotliCompressSync, constants } from 'node:zlib';
import { join } from 'node:path';
import { patchGlue } from '../lib/patch-glue.mjs';

const [mjsPath, wasmPath, vendorDir] = process.argv.slice(2);
if (!mjsPath || !wasmPath || !vendorDir) {
  console.error('usage: emit-vendor.mjs <mjs> <wasm> <vendorDir>');
  process.exit(1);
}

const patched = patchGlue(readFileSync(mjsPath, 'utf8'), {
  packageName: 'rive-wasm (source build, WeChat-native renderer)',
  version: 'weapp-lite',
});
writeFileSync(join(vendorDir, 'rive.glue.js'), patched);

const wasm = readFileSync(wasmPath);
const br = brotliCompressSync(wasm, {
  params: {
    [constants.BROTLI_PARAM_QUALITY]: 11,
    [constants.BROTLI_PARAM_SIZE_HINT]: wasm.length,
  },
});
writeFileSync(join(vendorDir, 'rive.wasm.br'), br);

writeFileSync(
  join(vendorDir, 'VERSION.json'),
  JSON.stringify(
    {
      source: 'rive-wasm source build',
      build: 'lite (no text/audio/layout/scripting), no-SIMD (WeChat compat), emmalloc, no wasm-opt',
      renderer: 'tools/rive-build/renderer.weapp.js (WeChat-native canvas2d)',
    },
    null,
    2,
  ) + '\n',
);

console.log(
  `[emit-vendor] glue ${patched.length.toLocaleString()}B · ` +
    `wasm ${(wasm.length / 1024).toFixed(0)}KB -> wasm.br ${(br.length / 1024).toFixed(0)}KB ` +
    `(${((br.length / wasm.length) * 100).toFixed(1)}%)`,
);
