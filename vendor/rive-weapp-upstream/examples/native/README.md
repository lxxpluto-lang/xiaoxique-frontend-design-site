# rive-weapp · native Mini Program demo

Rive 官方动画的**原生微信小程序**演示(无构建步骤)。渲染用仓库的 SDK [`packages/rive-weapp`](../../packages/rive-weapp)——通过 `npm run sync` 同步进 `miniprogram/pkgRive/libs/rive/`。

## 运行

```bash
# 从仓库根:  npm install && npm run sync && npm run fetch:examples
```

然后用**微信开发者工具**打开 `examples/native/` 目录(`project.config.json` → `miniprogramRoot: miniprogram/`)。appid 是占位的 `touristappid`,真机预览请改成你自己的 AppID。

编译运行 → 首页是示例画廊 → 点任意卡片进播放页(输入控件 + 状态日志 + 触摸交互)。

## 结构

```
examples/native/
├── project.config.json
└── miniprogram/
    ├── app.{js,json,wxss}
    ├── pages/index/         # 主包:示例画廊
    ├── data/examples.js     # 画廊清单(由 fetch:examples 生成)
    └── pkgRive/             # 分包(Rive 全部在这)
        ├── pages/player/    # 播放页
        ├── components/rive-view/   # ← 由 sync 从 SDK 同步
        ├── libs/rive/       # ← 由 sync 从 SDK 同步(adapter/runtime/layout/vendor)
        └── assets/riv/      # 官方 .riv(由 fetch:examples 下载)
```

> `pkgRive/libs/rive/` 和 `pkgRive/components/rive-view/` 是 SDK 的同步副本——别直接改,改 [`packages/rive-weapp`](../../packages/rive-weapp) 再跑 `npm run sync`。

接入方式与 API 见 [packages/rive-weapp/README.md](../../packages/rive-weapp/README.md)。
