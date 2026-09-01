# 架构与实现细节

本文记录把 Rive 官方运行时移植到微信小程序时的关键技术决策与实现。

## 1. 选型：Canvas 2D 低层 API + 源码自编 lite

Rive 的 web 运行时分两层：

- **高层包**（`@rive-app/canvas` / `webgl` / `webgl2`）：暴露 `Rive` 类，**硬绑** `HTMLCanvasElement` / `window`，并通过 `RuntimeLoader` 加载 wasm（且**从不**传 `instantiateWasm`）。在小程序里会直接失效。
- **低层包**（`@rive-app/canvas-advanced`）：暴露工厂 `RiveCanvas({ locateFile, instantiateWasm })`、`makeRenderer`、`load`、`Fit`/`Alignment` 等，DOM 耦合极小——**唯一**的 DOM 触点是 `makeRenderer(canvas)`（只需要一个有 `getContext('2d')` 的对象）。

| 包 | WASM 原始 | Brotli 后 | 渲染 | 小程序可行性 |
|---|---|---|---|---|
| **canvas-advanced-lite**（本项目默认） | 0.80 MB | **0.22 MB** | Canvas 2D | ✅ 最优 |
| canvas-advanced（含文字/音频/布局/脚本） | 1.85 MB | 0.53 MB | Canvas 2D | ✅ 需文字时用 |
| webgl | 5.7 MB | ~1.25 MB | WebGL1 | ⚠️ 体积大、需更多 shim |
| webgl2 | 2.33 MB | ~0.6 MB | WebGL2 | ❌ iOS 不稳定 |

加上小程序 WebGL2 在 iOS 不稳、以及「无法上传其它 Canvas 作为 WebGL 纹理」的限制，**Canvas 2D 是综合最优解**。

**lite vs full**：lite 在 Rive 的 C++ 构建里清空了 `--with_rive_text/audio/layout/scripting`（去掉 HarfBuzz+SheenBidi 文字引擎、miniaudio、Yoga、Luau），矢量 + 状态机 + 输入照常。本项目**从源码编译这个 lite 目标**(`npm run build:lite`，配微信原生 renderer);也保留了直接 repackage 官方预编译 lite 的备用路径(`npm run build:runtime`)。想更小(<200 KB)需从源码再砍数据绑定/ViewModel,见 [tools/rive-build/README.md](../tools/rive-build/README.md)。

## 2. WASM 加载：`instantiateWasm` → `WXWebAssembly`

小程序里 `WebAssembly` 全局不存在，只有 `WXWebAssembly.instantiate(path, imports)`：

- 第一个参数**只能是包内路径**（不能是 bytes / URL / 远程下载 / `data:`），支持 `.wasm` 和 `.wasm.br`（Brotli，基础库 ≥ 2.14.0）；
- 返回 `Promise<{ instance, module }>`。

Rive glue（Emscripten MODULARIZE）在实例化时会先看 `Module.instantiateWasm`：

```js
// vendor/rive.glue.js（原 canvas_advanced.mjs）
if (l.instantiateWasm) {
  try { return l.instantiateWasm(b, a); }   // b=imports, a=receiveInstance(instance)
  catch (c) { /* 回退到 fetch —— 我们要避免走到这里 */ }
}
```

我们的 [`adapter/loader.js`](../packages/rive-weapp/adapter/loader.js)：

```js
RiveCanvas({
  locateFile: () => path,
  instantiateWasm(imports, receiveInstance) {
    Promise.resolve()
      .then(() => WXWebAssembly.instantiate(path, imports)) // 不能同步 throw
      .then((r) => receiveInstance(r.instance, r.module))
      .catch(reject);
    return {}; // 告诉 Emscripten「我异步接管了」
  },
});
```

要点：**绝不能同步抛错**，否则 glue 会回退到根本不存在的 `fetch` 路径。内存由 wasm 自身导出（glue 读 `instance.exports.memory`），无需 JS 侧创建。

模块是**单例**：整个小程序共享一个 wasm 实例，多个画布各自 `makeRenderer`。

## 3. 全局垫片（[`adapter/polyfill.js`](../packages/rive-weapp/adapter/polyfill.js)）

原则：**只补 glue 真正会碰的**，且**不定义 `window`**（让 glue 走非浏览器分支，跳过它的 fetch/script-url 初始化）。

| 垫片 | 为什么 |
|---|---|
| `performance` | glue 的 FPS 路径读 `performance.now`（热路径已在 build 时改成 `Date.now`） |
| `WebAssembly`（含 `RuntimeError`） | glue abort 路径用 `new WebAssembly.RuntimeError`；映射到 `WXWebAssembly` |
| `requestAnimationFrame` | 防御性（渲染循环其实直接用 canvas 节点的 rAF） |
| `navigator` / `document` 桩 | **见下** |

### 图片网格 WebGL 辅助器的「加载即崩」

canvas-advanced 在**加载时就 eager 初始化**一个给「图片网格」用的离屏 WebGL 辅助器：

```js
na = new function() {
  function a() { var m = document.createElement("canvas"); /* getContext('webgl'/'webgl2') */ }
  ...
  a(); // ← 模块构造时就调用，小程序无 document → 崩
};
```

我们提供最小 `document` 桩，其 `createElement('canvas').getContext()` 返回 `null`，辅助器于是打印 `"Image mesh will not be drawn"` 并自行禁用，**矢量渲染照常**。这是 v1 的取舍（图片网格 `.riv` 属扩展范围）。要支持图片网格，可在此返回真正的 `wx.createOffscreenCanvas({type:'webgl'})`（但仍受小程序跨 Canvas 纹理限制）。

> 这个崩溃是 **Node 冒烟测试发现的真实 bug**（不是测试假象）——微信端同样会崩，垫片同时修复两端。

## 4. 路径渲染：命令录制 + 回放（微信原生 renderer）

Rive 的**浏览器版** renderer 用 `new Path2D()` + `ctx.fill(path2d)` 画路径、用 `new DOMMatrix()` 做变换——这两个全局小程序都没有，且微信对「把 `Path2D` 传给 `ctx.fill/stroke/clip`」「`Path2D.addPath` 带矩阵」的支持**没有文档保证**。

本项目从源码自编时，用 [`renderer.weapp.js`](../tools/rive-build/renderer.weapp.js) **替换** Rive 的浏览器 renderer（它本是 `--pre-js` 注入的纯 JS 画图后端），直接说微信 Canvas 2D：

- `DOMMatrix` → 普通 `{a..f}` 对象；
- 路径 → 纯 JS **命令录制器**（记录 `moveTo/lineTo/cubicTo/close/addPath`）；
- `fill/stroke/clip` 时 → `beginPath()` → 回放命令 → `fill(rule)`/`stroke()`/`clip(rule)`。

于是渲染**只依赖** `beginPath/moveTo/lineTo/bezierCurveTo/closePath/fill(rule)/stroke()/clip(rule)/save/restore/transform` 这些任何 canvas 实现都支持的原语。因为录制-回放**编译进了 renderer**，外层适配 [`canvas2d.js`](../packages/rive-weapp/adapter/canvas2d.js) 只剩 ~26 行(造个 surface 把真实 2D context 交回去)——不再需要 Path2D 全局、DOMMatrix 全局或 context Proxy。

> 这是相对「用预编译 glue + 适配层垫片」(`npm run build:runtime`，见 git 历史)更干净的形态。两者渲染结果与体积一致，区别在适配层的厚薄与可定制性。

### 几何等价性（为什么回放结果 == 原生 `ctx.fill(path2d)`）

Canvas 规范：**构建路径时**，每个点按「当时的 CTM」变换后存入路径；`fill()` 绘制已变换的路径（绘制时的 CTM 不再二次作用于路径几何）。

- 原生 `ctx.fill(path2d)`：`path2d` 存原始坐标，`fill` 时按当前 CTM 变换 → `device = CTM · p`。
- 我们的回放：在 Rive 已设置好的同一 CTM 下，同步 `beginPath()` + `moveTo(p)`（点在加入时即按当前 CTM 变换）→ `device = CTM · p`。二者一致。
- `addPath(sub, M)`：原生把 `M·p` 烤进路径，再 `·CTM` → `CTM·M·p`；我们 `save() → transform(M) → 回放 sub → restore()`，新 CTM = `CTM·M`，点 = `CTM·M·p`。**一致**。

`makeRenderer` 拿到的 **surface** 就是真实 canvas：`getContext('2d')` 直接返回原生 2D context（不再包装），HiDPI 由 `canvas.width/height = 布局 × dpr` 生效。

## 5. 渲染循环（[`runtime.js`](../packages/rive-weapp/runtime.js)）

canvas-advanced 把绘制操作**入队**，只有 `resolveAnimationFrame()` 才真正刷到 2D context（glue 里 `function c()` 遍历待刷新 renderer，执行其 op 队列）。官方文档也说：常规 rAF 循环里要在帧末调用一次 `resolveAnimationFrame()`。

所以循环是**每画布的 `canvas.requestAnimationFrame`**（真·逐屏 vsync、多实例安全），每帧：

```
advance (状态机 advanceAndApply / 动画 advance+apply+artboard.advance)
renderer.clear()
renderer.save()
renderer.align(fit, alignment, frameAABB(设备像素), artboardBounds)
artboard.draw(renderer)
renderer.restore()
rive.resolveAnimationFrame()   // ← 真正绘制到 context
```

其它要点：

- **首帧前先 `advance(0)`**：否则 artboard 几何未建立，首帧画空白。
- **HiDPI**：`canvas.width/height = 布局尺寸 × dpr`（设备像素缓冲），`align` 的 frame 用设备像素，内容铺满全分辨率缓冲，再由 WXSS 显示为布局尺寸 → 清晰。
- **渲染循环**：当前持续逐帧 rAF。空闲停帧(状态机 settled 且近期无触摸就停、触摸再唤醒)是计划中的省电优化，见 README 的性能清单。
- **DPR 上限**：`maxDpr` 可给 `canvas.width/height` 的 dpr 设上限(如 2);dpr=3 时是 9 倍像素缓冲,封顶能大幅省栅格化开销。
- **触摸命中**：`computeAlignment` 得到 artboard→设备矩阵，`invert` 后用 `mapXY` 把触点（× dpr）映射回 artboard 空间，再 `pointerDown/Move/Up`。
- **清理**：`cleanup()` 取消 rAF 并 `delete()` 所有 wasm 对象（sm/anim/artboard/file/renderer/matrices），**不**销毁共享模块。

## 6. 构建链（`tools/`）

```
rive-build/build-lite-weapp.sh:  从 C++ 源码编译(主构建) — emsdk + premake + 微信原生 renderer
                                  + lite + --no-wasm-simd → patch-glue → brotli → packages/rive-weapp/vendor/
build-runtime.mjs:               备用构建 — npm pack 预编译 lite → 解包 → patch-glue → brotli → vendor/
  └─ lib/patch-glue.mjs:         纯函数 + 锚点断言(2 处 patch),两套构建共用
sync-sdk.mjs:                    packages/rive-weapp → examples/{native,taro}(单一来源)
fetch-examples.mjs:              下载官方 .riv → examples/native + 生成主包 manifest
```

只有前两步接触上游 Rive;运行时适配层与 Rive 版本解耦。`packages/rive-weapp` 是 SDK 唯一真源,`sync` 把它同步进两个 demo。
