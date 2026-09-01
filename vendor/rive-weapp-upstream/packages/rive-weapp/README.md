# rive-weapp (SDK)

WeChat-native [Rive](https://rive.app) runtime for Mini Programs. Framework-agnostic core + ready-made components for native Mini Programs and Taro/React.

This directory is the **single source of truth**. The example apps embed a synced copy (a Mini Program can only `require` files inside its own package); run `npm run sync` from the repo root after editing anything here.

## Contents

```
index.js        createRive() — the public entry point
runtime.js      RiveInstance — render loop, state machine, inputs, hit-testing
layout.js       fit/alignment → artboard transform (contain/cover/fill/...)
adapter/
  loader.js     WXWebAssembly.instantiate(rive.wasm.br) via the instantiateWasm hook
  polyfill.js   minimal globalThis shims installed before the glue runs
  canvas2d.js   surface helper (26 lines — the native renderer needs almost nothing)
vendor/
  rive.glue.js  patched Emscripten glue (ESM→CJS, Date.now clock) — AUTO-GENERATED
  rive.wasm.br  Rive core, source-built, brotli (224 KB) — AUTO-GENERATED
components/
  native/rive-view/   <rive-view> custom component (WXML)
  react/RiveView.tsx   <RiveView> component (Taro + React)
```

`vendor/` is built by `npm run build:lite` (from C++ source) or `npm run build:runtime` (repackage prebuilt). Everything else is hand-written and framework-agnostic.

## Install into your Mini Program

1. Copy `index.js` / `runtime.js` / `layout.js` / `adapter/` / `vendor/` into a **subpackage** (e.g. `/pkgRive/libs/rive/`). Keep `rive.wasm.br` in-package — `WXWebAssembly` can only load package-local paths.
2. Copy the component for your framework (`components/native/rive-view/` or `components/react/RiveView.tsx`).
3. If your SDK path differs from the default `/pkgRive/libs/rive/vendor/rive.wasm.br`, call `setWasmPath('/your/path/rive.wasm.br')` once at startup.

## API

### `createRive(opts) → Promise<RiveInstance>`

Resolves once the `.riv` is loaded and the first frame is drawn.

| opt | type | notes |
|---|---|---|
| `canvas` | node | **required.** A real WeChat canvas node from `SelectorQuery().fields({node:true}).node()`. |
| `src` | string | `.riv` source — package path, wx temp file, or `https://…`. (Alternative to `buffer`.) |
| `buffer` | ArrayBuffer | raw `.riv` bytes (use for base64-inlined assets). |
| `width`, `height` | number | layout size in px. |
| `devicePixelRatio` | number | from `wx.getWindowInfo().pixelRatio` — keeps HiDPI crisp. |
| `maxDpr` | number | cap the DPR (e.g. `2`). `0` = uncapped. Biggest perf lever on hi-dpi devices. |
| `fit` | string | `contain`(default) `cover` `fill` `fitWidth` `fitHeight` `none` `scaleDown`. |
| `alignment` | string | `center`(default) `topLeft` … `bottomRight`. |
| `stateMachine` | string | optional; defaults to the artboard's first state machine. |
| `autoplay` | boolean | default `true`. |

### `RiveInstance`

```js
rive.play();  rive.pause();
rive.setBool('open', true);
rive.setNumber('level', 80);
rive.fireTrigger('press');
rive.getInputs();              // [{ name, type: 'bool'|'number'|'trigger' }]
rive.resize(cssW, cssH, dpr);  // call on layout change
rive.cleanup();                // ALWAYS call on page unload (frees wasm + stops the loop)
```

Also exported: `loadRivBuffer(src)`, `setWasmPath(path)`, `DEFAULT_WASM_PATH`, `RiveInstance`.

### Components

**Native** — register in `page.json`, then:

```html
<rive-view src="/pkgRive/assets/riv/vehicles.riv" fit="contain" maxDpr="{{2}}"
  bind:load="onLoad" bind:error="onError" bind:statechange="onState"
  style="width:100%;height:60vh;" />
```

```js
const v = this.selectComponent('#rive');
v.fireTrigger('press'); v.setNumber('level', 80); v.getInputs();
```

**Taro / React** — `ref` exposes the same methods:

```tsx
const ref = useRef(null);
<RiveView ref={ref} src={buffer} fit="contain" maxDpr={2} onLoad={onLoad} onStateChange={onState} />
// ref.current.fireTrigger('press')
```

## Build provenance

The runtime is **compiled from the Rive C++ runtime** (not the prebuilt npm package) as a **lite** target — no text layout, audio, Yoga layout, or Luau scripting — with a hand-written WeChat-native canvas2d renderer in place of Rive's browser `renderer.js`. Built **without WASM SIMD and without `wasm-opt`'s GC features**, both of which WeChat's `WXWebAssembly` cannot compile. See [tools/rive-build/README.md](../../tools/rive-build/README.md).
