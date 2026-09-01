# rive-weapp · Taro + React demo

Rive 官方动画在微信小程序里的 **Taro 4 + React 18** 演示。界面是 React,渲染用仓库的 SDK [`packages/rive-weapp`](../../packages/rive-weapp)——它通过 `npm run sync` 同步进 `src/pkgRive/rive/`。

> 技术栈:Taro 4.2.0 / React 18.3.1 / TypeScript / webpack5。`project.config.json` 的 appid 是占位的 `touristappid`,真机预览请改成你自己的 AppID。

## 运行

```bash
# 从仓库根先同步 SDK(若还没做):  npm install && npm run sync
cd examples/taro
npm install
npm run build:weapp      # 产出 dist/  (或 npm run dev:weapp 走 watch)
```

然后用**微信开发者工具**打开 `examples/taro/` 目录(`project.config.json` 的 `miniprogramRoot` 指向 `dist/`)。首页是示例画廊,点卡片进播放页;或在编译模式下拉里选 "Rive Demo (vehicles)" 直达。

## 结构

```
examples/taro/
├── config/index.js          # Taro 配置(copy 把 wasm.br 拷进 dist)
├── project.config.json      # appid + miniprogramRoot: dist/
├── scripts/inline-riv.mjs   # 把 .riv 内联成 base64(绕开 readFile 权限)
└── src/
    ├── app.config.ts        # pages + subPackages(pkgRive)
    ├── pages/index/         # 主包:示例画廊(导航到分包)
    └── pkgRive/             # 分包(Rive 全部在这,避免撑爆主包 2MB)
        ├── demo/            # 播放页(动态输入控件 + 状态日志 + 触摸)
        ├── components/RiveView.tsx   # ← 由 sync 从 SDK 同步
        ├── rive/            # ← 由 sync 从 SDK 同步(adapter/runtime/layout/vendor)
        └── assets/          # .riv(base64 内联)
```

> `pkgRive/rive/` 和 `pkgRive/components/RiveView.tsx` 是 SDK 的同步副本——别直接改,改 [`packages/rive-weapp`](../../packages/rive-weapp) 再跑 `npm run sync`。

## 关键点

- **分包**:Rive 运行时 + wasm + .riv 全放 `pkgRive` 分包;主包只有画廊。进播放页时才下载分包。
- **WASM 路径**:`RiveView.tsx` 里 `setWasmPath('/pkgRive/rive/vendor/rive.wasm.br')`;该文件由 `config/index.js` 的 `copy` 拷到 dist。
- **同一套 SDK** 也能在原生小程序里跑,见 [`examples/native`](../native)。
- **基础库**:需 ≥ 2.13.0(WXWebAssembly)。

## 用法

```tsx
import RiveView, { RiveViewHandle } from './pkgRive/components/RiveView'

const ref = useRef<RiveViewHandle>(null)
<RiveView ref={ref} src='/pkgRive/assets/riv/vehicles.riv' fit='contain' maxDpr={2}
  onLoad={(info) => console.log(info.inputs)} style={{ width: '100%', height: '720rpx' }} />

ref.current?.fireTrigger('press')
ref.current?.setNumber('level', 80)
```
