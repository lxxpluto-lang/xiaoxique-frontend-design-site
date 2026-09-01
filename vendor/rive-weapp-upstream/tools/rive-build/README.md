# 从源码构建微信原生的 Rive lite WASM

把 Rive 的 C++ 运行时编译成一个**为微信小程序定做**的最小 WASM:lite 特性裁剪 + 一个微信原生的 canvas2d 渲染后端。产物落进 `packages/rive-weapp/vendor/`(再 `npm run sync` 进两个 demo)。

## 产物体积

| 阶段 | 原始 wasm | brotli |
|---|---|---|
| 官方 full(含文字/音频/布局/脚本) | 1.85 MB | 557 KB |
| 官方 lite(砍掉上面四项) | 795 KB | 224 KB |
| **本项目:lite + emmalloc + 微信原生 renderer + 无 SIMD** | **793 KB** | **224 KB** |

> **诚实说明**:brotli 后与官方 lite 持平(~224 KB)。SIMD 与 `wasm-opt` 本可再省 ~8 KB,但**正是微信引擎不兼容的**(见下),只能放弃。所以源码自编的价值不在更小的体积,而在**微信原生渲染后端**(干净的薄适配)+ **可继续从源码裁剪**的能力(预编译包做不到)。

## 一条命令

```bash
npm run build:lite     # = tools/rive-build/build-lite-weapp.sh
```

它会(幂等,已存在的步骤自动跳过):

1. clone `rive-app/rive-wasm` + `rive-runtime` 子模块;
2. 装 **emsdk 3.1.61**(Rive 固定版本,约 1–2 GB)+ **premake 5.0.0-beta7**;
3. 用 [`renderer.weapp.js`](renderer.weapp.js) 覆盖 Rive 的浏览器 `js/renderer.js`,并给 release 加 `-s MALLOC=emmalloc`;
4. 以 **lite**(无 `--with_rive_text/audio/layout/scripting`)+ **`--no-wasm-simd`** + `-Oz --closure 1` 构建 `rive_wasm`;
5. patch glue(ESM→CommonJS、`emscripten_get_now`→`Date.now`)+ Brotli,写入 `packages/rive-weapp/vendor/`。

完成后同步进两个 demo:

```bash
npm run sync
```

## 微信兼容:为什么关 SIMD、不用 wasm-opt

微信的 `WXWebAssembly` 引擎只支持基础 WASM 特性,两类「优化」会让它**编译报错**:

- **WASM SIMD**(`-msimd128`,emcc 默认开)→ 真机 `CompileError: invalid value type 0x7B`。所以加 `--no-wasm-simd`(官方预编译包同样不带 SIMD)。
- **`wasm-opt -all`** → `-all` 会开启 GC / function-references,把模块改写成非空 ref 类型(`0x64`)→ `invalid value type 0x64`。所以**完全不跑 wasm-opt**,直接用 emcc `-Oz` 产物。

`wasm-dis` 可验证产物:SIMD 指令数应为 0、ref/gc 指令数应为 0。

## 微信原生渲染后端(关键)

[`renderer.weapp.js`](renderer.weapp.js) 替换 Rive 的[浏览器 renderer.js](https://github.com/rive-app/rive-wasm/blob/master/wasm/js/renderer.js)(本是 `--pre-js` 注入的纯 JS 画图后端)。改动:

- `new DOMMatrix()` → 普通 `{a..f}` 对象;
- `new Path2D()` → 纯 JS **命令录制器**;`ctx.fill/stroke/clip(path)` → `beginPath` + 回放 + `fill(rule)`/`stroke()`/`clip(rule)`(几何等价,只依赖必然支持的原语);
- 移除 `document.createElement('canvas')` + WebGL 图片网格、`new Image()`/`Blob`/`URL` 光栅解码(优雅降级,矢量不受影响)。

**好处**:渲染器直接说微信 Canvas 2D,外层适配从「Path2D 录制器 + context Proxy + DOMMatrix 垫片」(~180 行)砍到 [`canvas2d.js`](../../packages/rive-weapp/adapter/canvas2d.js) 的 ~26 行。

> ⚠️ 因此适配层与这个自编 renderer **绑定**。若切回预编译 glue(`@rive-app/canvas-advanced*`,即 `npm run build:runtime`),需从 git 历史恢复那套外层适配。

## 变体

- **要文字**:去掉 lite 编 full —— premake 调用加回 `--with_rive_text`(HarfBuzz+SheenBidi 较大,但仍远小于官方 full)。
- **再压到 <200 KB(进阶、有风险)**:从 `rive-runtime` 源码删数据绑定/ViewModel —— `premake5_v2.lua` 的 `files()` 加 `removefiles({'src/data_bind/**','src/viewmodel/**'})`,并在 `wasm/src/bindings.cpp` `#ifdef` 掉对应 `viewmodel_instance_*` 注册。**会让用到数据绑定的 `.riv` 失效**,谨慎使用。

## 升级 Rive

删掉 `RIVE_BUILD_WORK`(默认 `/tmp/rive-build`)重跑脚本即可拉最新源码重建。patch 锚点有断言,上游变了会带具体锚点报错。
