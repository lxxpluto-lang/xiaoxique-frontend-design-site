# rive-weapp

> Run [Rive](https://rive.app) animations in **WeChat Mini Programs** — load official `.riv` files with full state-machine, input, and touch support.
>
> 在**微信小程序**里运行 Rive 动画:直接加载官方 `.riv`,支持状态机、输入与触摸交互。

据调研,这是**首个**把 Rive 官方运行时带进微信小程序的开源实现。引擎核心从 **Rive C++ 源码自编译**,配一个**为微信 `<canvas type="2d">` 手写的原生渲染后端**——不依赖 `Path2D` / `DOMMatrix` / `document` / WebGL,所以适配层极薄。同一套框架无关的运行时,**原生小程序**与 **Taro + React** 两种接入都给到了。

|  |  |
|---|---|
| 渲染后端 | Canvas 2D · **微信原生**(Rive C++ 源码自编译,lite) |
| WASM 加载 | `WXWebAssembly` + Brotli(`rive.wasm.br`,**224 KB**) |
| 兼容性 | **无 SIMD、无 WebGL、无 GC**——对齐官方预编译,iOS/Android 一致 |
| 能力 | 矢量动画 · 状态机 · 输入(bool/number/trigger) · 触摸命中 · HiDPI |
| 主包体积 | ~60 KB · 运行时分包 ~610 KB(均 < 2 MB 上限) |

---

## 仓库结构

```
rive-weapp/
├── packages/rive-weapp/      ← SDK(单一来源,完整封装)
│   ├── index.js runtime.js layout.js   核心(框架无关)
│   ├── adapter/              WXWebAssembly 加载 + 运行时垫片
│   ├── vendor/               rive.glue.js + rive.wasm.br(源码自编产物)
│   └── components/
│       ├── native/rive-view/    原生小程序组件
│       └── react/RiveView.tsx    Taro + React 组件
├── examples/
│   ├── native/               原生小程序 demo(画廊 + 播放页)
│   └── taro/                 Taro + React demo
├── tools/
│   ├── rive-build/           从 C++ 源码编译引擎(主构建)
│   ├── build-runtime.mjs     repackage 官方预编译 lite(备用构建)
│   ├── sync-sdk.mjs          SDK → 两个 demo(单一来源)
│   └── fetch-examples.mjs    拉取官方示例 .riv
├── test/smoke.test.mjs       Node 端到端冒烟测试
└── docs/                     架构 + API
```

> **单一来源**:[`packages/rive-weapp`](packages/rive-weapp) 是 SDK 的唯一真源。小程序只能 require 自己包内的文件,所以两个 demo 各内嵌一份**同步副本**——改完 SDK 跑 `npm run sync` 即可。

---

## 快速开始

> 需要:[微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html) + Node ≥ 18。

```bash
git clone <repo> && cd rive-weapp
npm install
npm run sync          # 把 SDK 同步进两个 demo
npm test              # Node 里端到端验证运行时(可选)
```

**跑原生 demo**:微信开发者工具打开 [`examples/native/`](examples/native)(读 `project.config.json` → `miniprogramRoot: miniprogram/`),在里面把 `appid` 换成你的测试号 → 编译。首页是示例画廊,点卡片进播放页。

**跑 Taro demo**:

```bash
cd examples/taro && npm install && npm run build:weapp
```

再用开发者工具打开 `examples/taro/`。

---

## 在你自己的小程序里用

把 [`packages/rive-weapp`](packages/rive-weapp) 的 `index.js` / `runtime.js` / `layout.js` / `adapter/` / `vendor/` 拷进你的子包(例如 `/pkgRive/libs/rive/`),再按框架拷对应组件。完整 API 见 [packages/rive-weapp/README.md](packages/rive-weapp/README.md)。

### 组件(推荐)

```html
<!-- 原生小程序 -->
<rive-view
  src="/pkgRive/assets/riv/vehicles.riv"
  fit="contain" alignment="center"
  bind:load="onLoad" bind:statechange="onState"
  style="width:100%;height:60vh;" />
```

```tsx
{/* Taro + React */}
<RiveView ref={ref} src={buffer} fit="contain" onLoad={onLoad} />
```

### 直接用 API(框架无关)

```js
const { createRive } = require('/pkgRive/libs/rive/index.js');
const rive = await createRive({
  canvas, src: '/pkgRive/assets/riv/skills.riv',
  width, height, devicePixelRatio,
  fit: 'contain', alignment: 'center',
});
rive.fireTrigger('press');
rive.setNumber('level', 80);
rive.cleanup();  // 页面卸载时务必调用
```

---

## 为什么是 Canvas 2D 而不是 WebGL?

直觉上「WebGL = 更快」,但在小程序这个环境里不成立:

- 小程序 **WebGL2 在 iOS 上不稳定**(官方明确不建议),而 Rive 的 GPU 渲染依赖 WebGL2/扩展;
- WebGL 包的 WASM 是 **5.7 MB**(Canvas 版仅 1.85 MB);
- 小程序 WebGL **无法直接上传其它 Canvas 纹理**(libpag 也踩过)。

所以 Canvas 2D 是小程序上**性能与兼容性综合最优**的选择:体积最小、跨端一致、适配最干净。详见 [docs/architecture.md](docs/architecture.md)。

---

## 工作原理(难点)

小程序 JS 环境**不是浏览器**:没有 `window`/`document`/`fetch`,WASM 只能经 `WXWebAssembly` 从包内路径加载。本项目的解法:

1. **WASM 加载** —— 接管 Rive 的 `instantiateWasm` 钩子,调 `WXWebAssembly.instantiate('/pkgRive/.../rive.wasm.br', imports)`(包内路径、Brotli、无 fetch)。
2. **微信原生渲染后端** —— 从 Rive C++ 源码编译时,用一个[手写的 canvas2d 渲染器](tools/rive-build/renderer.weapp.js)替换浏览器版 `renderer.js`。它直接驱动 `<canvas type="2d">`,不碰 `Path2D` / `DOMMatrix` / `document` / WebGL——这让外层适配从 ~180 行的「Path2D 录制器 + Proxy + 垫片」砍到 [26 行](packages/rive-weapp/adapter/canvas2d.js)。
3. **极小 glue 补丁** —— 只对上游 glue 打 **2 处**补丁(ESM→CommonJS、`emscripten_get_now`→`Date.now`),其余全在运行时适配,升级 Rive 几乎零维护。

### 微信兼容性踩坑(都已填平)

| 坑 | 现象 | 解法 |
|---|---|---|
| WASM SIMD | `invalid value type 0x7B` | **关 SIMD 编译**(`--no-wasm-simd`,对齐官方) |
| wasm-opt 的 GC | `invalid value type 0x64` | 去掉 `wasm-opt -all`(它引入 GC/func-ref) |
| `.riv` 读不到 | `readFile fail permission denied` | 资源 base64 内联,绕开文件系统权限 |
| 状态机触发器 | `fire()` 不存在 | 经 embind `asTrigger().fire()` 转型调用 |
| canvas-id 冲突 | 拿到无 `getContext` 的旧节点 | `type="2d"` 配 `id`、不用 `canvasId` |

---

## 构建与升级

```bash
npm run build:lite      # 主构建:从 Rive C++ 源码编译(见 tools/rive-build/README.md)
npm run build:runtime   # 备用:repackage 官方预编译 lite 包
npm run sync            # 产物 → 两个 demo
```

源码构建一条命令复现(自动装 emsdk / premake、套用微信原生 renderer、关 SIMD、brotli 压缩),详见 [tools/rive-build/README.md](tools/rive-build/README.md)。

> **关于 224 KB**:lite 砍掉文字/音频/布局(Yoga)/脚本(Luau)。SIMD 与 `wasm-opt` 能再省 ~8 KB,但**恰恰是微信不兼容的**,只能放弃——所以体积与官方预编译 lite 持平,源码自编的价值在「微信原生渲染后端 + 可继续裁剪」。想再压到 <200 KB 需从源码删数据绑定/ViewModel(有风险)。

---

## 限制与已知问题

- **图片网格 / 内嵌位图**:优雅降级(不绘制网格,矢量正常)。小程序 WebGL 跨 Canvas 纹理限制使其难支持。
- **文字 / 音频**:lite 不含(无文字排版、无 `AudioContext`)。带文字的 `.riv` 文字不显示;需要时改 full 构建。
- **真机像素验证**:自动化测试覆盖「能加载、能解析、能产出绘制调用」;**最终视觉请在真机预览**(不同机型 Canvas 2D 细节可能有差异)。

---

## 测试

`npm test` 在 Node 下用 `WXWebAssembly`/canvas 替身**端到端**跑通:加载真实 wasm、解析全部 6 个官方 `.riv`、验证绘制调用、HiDPI、输入与触摸命中、清理。这是真机像素之外能做到的最强验证。

---

## 许可

- 本项目代码:MIT(见 [LICENSE](LICENSE))。
- `vendor/` 的 wasm/glue 由 [Rive C++ 运行时](https://github.com/rive-app/rive-runtime)(MIT,© Rive)编译而来。
- 示例 `.riv` 为 Rive 官方公开演示资源,版权归 Rive,仅作演示。
