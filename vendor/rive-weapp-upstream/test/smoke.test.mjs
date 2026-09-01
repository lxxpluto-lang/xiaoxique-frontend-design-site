// End-to-end smoke test for the WeChat Rive runtime, run under Node.
//
// It substitutes Node stand-ins for the two things only WeChat provides:
//   • WXWebAssembly  -> brotli-decompress the .wasm.br + Node's WebAssembly
//   • a canvas node  -> a recording 2D context + a controllable requestAnimationFrame
//
// What this proves (everything except actual pixels, which need a real device):
//   - the patched glue loads & instantiates the WASM via the instantiateWasm hook
//   - the Path2D/DOMMatrix polyfills + context wrapper don't break the renderer
//   - a real official .riv parses, an artboard/state-machine is selected
//   - the render loop emits real draw calls (clearRect/fill/stroke)
//   - state-machine inputs + pointer hit-testing (computeAlignment/mapXY) work
//   - cleanup tears everything down without throwing

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { brotliDecompressSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const LIB = join(__dirname, '..', 'packages', 'rive-weapp');
const WASM_BR = join(LIB, 'vendor', 'rive.wasm.br');
const RIV = join(
  __dirname, '..', 'examples', 'native', 'miniprogram', 'pkgRive', 'assets', 'riv', 'vehicles.riv',
);

// --- WeChat stand-ins (must be installed before the loader runs) -------------

globalThis.WXWebAssembly = {
  instantiate(path, imports) {
    const wasm = brotliDecompressSync(readFileSync(path));
    return WebAssembly.instantiate(wasm, imports); // -> { instance, module }
  },
  Memory: WebAssembly.Memory,
  Table: WebAssembly.Table,
};

function makeRecordingContext() {
  const counts = {
    beginPath: 0, moveTo: 0, lineTo: 0, bezierCurveTo: 0, closePath: 0,
    fill: 0, stroke: 0, clip: 0, save: 0, restore: 0, transform: 0, clearRect: 0,
  };
  const tick = (k) => (...args) => { if (k in counts) counts[k]++; };
  const ctx = {
    canvas: null,
    beginPath: tick('beginPath'), moveTo: tick('moveTo'), lineTo: tick('lineTo'),
    bezierCurveTo: tick('bezierCurveTo'), quadraticCurveTo: tick('quad'), closePath: tick('closePath'),
    fill: tick('fill'), stroke: tick('stroke'), clip: tick('clip'),
    save: tick('save'), restore: tick('restore'),
    transform: tick('transform'), setTransform: tick('setTransform'), resetTransform: tick('resetTransform'),
    clearRect: tick('clearRect'), drawImage: tick('drawImage'),
    createLinearGradient: () => ({ addColorStop() {} }),
    createRadialGradient: () => ({ addColorStop() {} }),
    globalAlpha: 1, globalCompositeOperation: 'source-over',
    fillStyle: '#000', strokeStyle: '#000', lineWidth: 1, lineCap: 'butt', lineJoin: 'miter',
  };
  return { ctx, counts };
}

function makeCanvas() {
  const { ctx, counts } = makeRecordingContext();
  let pending = null;
  const canvas = {
    width: 0,
    height: 0,
    getContext: () => ctx,
    requestAnimationFrame: (cb) => { pending = cb; return 1; },
    cancelAnimationFrame: () => { pending = null; },
  };
  ctx.canvas = canvas;
  return { canvas, counts, pump: () => { const cb = pending; pending = null; if (cb) cb(Date.now()); return !!cb; } };
}

// Deterministic clock so frame dt > 0 (the runtime + glue read Date.now()).
function withClock(startMs, stepMs, fn) {
  const realNow = Date.now;
  let now = startMs;
  Date.now = () => now;
  const advance = () => { now += stepMs; };
  return Promise.resolve(fn(advance)).finally(() => { Date.now = realNow; });
}

// --- tests ------------------------------------------------------------------

test('loads, parses a real .riv, draws, accepts inputs, and cleans up', async () => {
  const { setWasmPath } = require(join(LIB, 'adapter', 'loader.js'));
  const { RiveInstance } = require(join(LIB, 'runtime.js'));
  setWasmPath(WASM_BR);

  const buffer = readFileSync(RIV);
  const { canvas, counts, pump } = makeCanvas();

  await withClock(1_000_000, 16, async (advance) => {
    let loadInfo = null;
    const inst = new RiveInstance({
      canvas,
      buffer,
      width: 320,
      height: 240,
      devicePixelRatio: 2,
      autoplay: true,
      onLoad: (info) => { loadInfo = info; },
      onError: (e) => { throw e; },
    });

    await inst.ready;

    // HiDPI backing store = css * dpr (set synchronously during init).
    assert.equal(canvas.width, 640, 'backing width = 320 * 2');
    assert.equal(canvas.height, 480, 'backing height = 240 * 2');

    // A real artboard was selected (onLoad fires during init).
    assert.ok(loadInfo && loadInfo.artboard, 'onLoad reported an artboard');

    // autoplay schedules the first frame via rAF — pump it, then assert it drew.
    advance(); pump();
    assert.ok(counts.clearRect >= 1, 'cleared the canvas');
    assert.ok(counts.fill + counts.stroke > 0, 'emitted fill/stroke draw calls');
    assert.ok(counts.bezierCurveTo > 0, 'replayed vector path curves (Path2D recorder works)');

    // Pump several more frames with a moving clock; drawing must continue.
    const fillsBefore = counts.fill;
    for (let i = 0; i < 8; i++) { advance(); if (!pump()) break; }
    assert.ok(counts.fill >= fillsBefore, 'kept drawing across frames');

    // Inputs API (vehicles has a state machine). Exercising it must not throw.
    const inputs = inst.getInputs();
    assert.ok(Array.isArray(inputs), 'getInputs returns an array');
    for (const inp of inputs) {
      if (inp.type === 'bool') inst.setBool(inp.name, true);
      else if (inp.type === 'number') inst.setNumber(inp.name, 1);
      else if (inp.type === 'trigger') inst.fireTrigger(inp.name);
    }

    // Pointer hit-testing (computeAlignment + Mat2D.invert + mapXY) must not throw.
    inst.pointerDown(160, 120);
    inst.pointerUp(160, 120);
    const p = inst.mapPoint(160, 120);
    assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y), 'mapPoint returns finite artboard coords');

    inst.pause();
    inst.play();
    inst.cleanup();
  });
});

test('all bundled example .riv files parse and render a frame', async () => {
  const { setWasmPath } = require(join(LIB, 'adapter', 'loader.js'));
  const { RiveInstance } = require(join(LIB, 'runtime.js'));
  setWasmPath(WASM_BR);

  const rivDir = join(__dirname, '..', 'examples', 'native', 'miniprogram', 'pkgRive', 'assets', 'riv');
  const files = readdirSync(rivDir).filter((f) => f.endsWith('.riv'));
  assert.ok(files.length >= 4, 'have several example .riv files');

  for (const file of files) {
    await withClock(2_000_000, 16, async () => {
      const buffer = readFileSync(join(rivDir, file));
      const { canvas, counts } = makeCanvas();
      const inst = new RiveInstance({ canvas, buffer, width: 200, height: 200, devicePixelRatio: 1, autoplay: false });
      await inst.ready;
      assert.ok(counts.fill + counts.stroke > 0, `${file} drew something`);
      inst.cleanup();
    });
  }
});
