#!/usr/bin/env node
// Sync the canonical SDK (packages/rive-weapp) into both example apps.
//
// The SDK is one source of truth; the demos embed a copy (a Mini Program can
// only require files inside its own package root). Run this after changing the
// SDK or rebuilding the vendor runtime:  npm run sync
//
//   packages/rive-weapp/{index,runtime,layout}.js + adapter/ + vendor/
//     -> examples/native/miniprogram/pkgRive/libs/rive/
//     -> examples/taro/src/pkgRive/rive/
//   packages/rive-weapp/components/native/rive-view/ -> native demo component
//   packages/rive-weapp/components/react/RiveView.tsx -> taro demo component

import { cpSync, rmSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SDK = join(ROOT, 'packages', 'rive-weapp');
const CORE = ['index.js', 'runtime.js', 'layout.js', 'adapter', 'vendor'];

function syncCore(destDir) {
  mkdirSync(destDir, { recursive: true });
  for (const item of CORE) {
    const dst = join(destDir, item);
    rmSync(dst, { recursive: true, force: true });
    cpSync(join(SDK, item), dst, { recursive: true });
  }
}

function syncComponent(srcRel, dstAbs) {
  rmSync(dstAbs, { recursive: true, force: true });
  mkdirSync(dirname(dstAbs), { recursive: true });
  cpSync(join(SDK, srcRel), dstAbs, { recursive: true });
}

// Native WeChat demo
syncCore(join(ROOT, 'examples/native/miniprogram/pkgRive/libs/rive'));
syncComponent(
  'components/native/rive-view',
  join(ROOT, 'examples/native/miniprogram/pkgRive/components/rive-view'),
);

// Taro + React demo
syncCore(join(ROOT, 'examples/taro/src/pkgRive/rive'));
syncComponent(
  'components/react/RiveView.tsx',
  join(ROOT, 'examples/taro/src/pkgRive/components/RiveView.tsx'),
);

console.log('[sync-sdk] packages/rive-weapp -> examples/native + examples/taro ✓');
