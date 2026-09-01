# 小喜鹊运动伙伴（UniApp + Rive）

这是一个可直接运行的 UniApp Vue 3 工程，已完成三个电影化动作预览：年长女性与小喜鹊同步八段锦、双辫女孩托举小喜鹊完成趣味抗阻，以及小喜鹊唱歌并飞出画面。页面同时包含“打卡成功”奖励动效，并预留 App/H5 与微信小程序两套 Rive 播放路径。

## 已完成

- 三段 4.5–5.15 秒循环 MP4：720 × 600、H.264、60fps、无音轨。
- 三套 4 × 2 完整电影化分镜和每个动作的 8 张分帧 PNG。
- 加入建立镜头、中景推近、低机位高潮、空镜、回场与收尾英雄镜头。
- 唱歌场景在页面层叠加透明飞行角色，实现真正越过视频卡片边界的“破屏”效果。
- App/H5：安装 `@rive-app/canvas-single@2.41.0`，通过 renderjs 连接 Rive Canvas。
- 微信小程序：内置 `rive-weapp` 原生组件及其 WASM 运行库；当前 MP4 可直接运行，换入 `.riv` 后可启用实时动画。
- H5、微信小程序、App 三端生产构建已通过；TypeScript 检查已通过。

## 直接运行

```bash
npm install
npm run dev:h5
```

生产构建：

```bash
npm run type-check
npm run test:rive-runtime
npm run build:h5
npm run build:mp-weixin
npm run build:app
```

构建目录分别是：

- `dist/build/h5`
- `dist/build/mp-weixin`
- `dist/build/app`

微信端使用已经安装的微信开发者工具导入 `dist/build/mp-weixin`。App 端使用已经安装的 HBuilderX 导入本工程或 `dist/build/app`。

## Rive 文件怎么换入

现在三个 V3 Rive 目标路径已经集中写在 `src/lib/rive-motion.ts`，但在二进制文件导出和验证前保持 `enabled: false`，因此页面会安全回退到 MP4。Rive Desktop 完成骨骼与状态机后：

1. 把 `.riv` 放到 `src/static/rive/`。
2. 运行 `npm run test:rive-runtime`，确认微信 Canvas2D 引擎能解析并驱动 Rive。
3. 打开 `src/lib/rive-motion.ts`，把对应动作的 `enabled` 改为 `true`。
4. 重新运行三端构建并在真机检查微信 Canvas2D 表现。

详细的 Rive 分层、状态机和平台注意事项见 [`docs/RIVE-HANDOFF.md`](docs/RIVE-HANDOFF.md)。初版提示词见 [`docs/ASSET-PROMPTS.md`](docs/ASSET-PROMPTS.md)，电影化完整分镜提示词见 [`docs/ASSET-PROMPTS-CINEMATIC-V2.md`](docs/ASSET-PROMPTS-CINEMATIC-V2.md)。

真正的骨骼动画 V3 已完成透明拆层素材、机器可读骨骼蓝图、部件绑定表和 UniApp 状态机接口，制作规范见 [`docs/RIVE-V3-PRODUCTION.md`](docs/RIVE-V3-PRODUCTION.md)。Rive Desktop 已登录；系统解锁后继续在画布中绑定并导出实际 `.riv`。

## 关键目录

```text
src/components/MagpieMotion.vue       App/H5/微信统一播放器
src/lib/rive-motion.ts                三动作 Rive 运行契约与启用开关
src/pages/index/index.vue             三动作选择与打卡奖励页面
src/static/videos/                    三段 MP4
src/static/frames/                    每个动作的八张电影化分帧
src/static/storyboards/               三张完整故事板
src/static/overlays/                  唱歌破屏飞行透明角色
src/static/rive/                      后续 .riv 文件投放位置
src/wxcomponents/rive-view/           微信原生 Rive + WASM
vendor/rive-weapp-upstream/            上游源码、说明和许可证
scripts/build-cinematic-motion-v2.sh   重新生成三段 60fps 视频
```

## 当前需要账号才能做的步骤

- 微信开发者工具扫码登录，并在 `src/manifest.json` 填写小程序 AppID。
- HBuilderX 登录 DCloud 账号后进行云打包/签名，或配置本地 Android/iOS 证书。
- 系统解锁后，在已登录的 Rive Desktop 中完成骨骼绑定并导出正式 `.riv`。

这些步骤不影响当前工程预览、代码开发和三端编译。
