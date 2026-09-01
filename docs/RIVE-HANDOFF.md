# Rive 制作与交付说明

## 难度判断

| 交付层级 | 难度 | 典型时间 | 当前状态 |
|---|---:|---:|---|
| MP4 视觉原型与按钮切换 | 低 | 0.5–1 天 | 已完成 |
| Rive 矢量重绘、骨骼和三段循环 | 中 | 2–4 天 | 工具与接口已就绪，待人工矢量化 |
| 多领国式状态机、触摸反馈与完整打卡庆祝 | 中高 | 3–6 天 | 已完成轻量 CSS 版本，Rive 状态机待制作 |
| 微信小程序真机 Rive 兼容与性能收口 | 高 | 1–3 天 | 运行库已内置，待正式 `.riv` 真机验证 |

AI 能明显缩短故事板、动作拆解和视觉探索，但不能可靠地把扁平 PNG 自动转换成结构干净、可维护的 Rive 骨骼文件。正式 `.riv` 仍建议在 Rive Desktop 中完成矢量重绘、分层、约束和状态机。

## 推荐文件结构

优先采用一个 `magpie-motions.riv`：

```text
Artboard: Magpie
State machine: Motion Machine
Inputs:
  activity       Number   0=待机 1=八段锦 2=马步 3=唱歌
  celebrate      Trigger  完成打卡
  reducedMotion  Bool     减少动态效果
Animations:
  idle
  baduanjin
  horse_stance
  singing
  checkin_success
```

如果制作时间非常紧，先导出三个独立文件也可以：

- `magpie-baduanjin.riv`
- `magpie-horse-stance.riv`
- `magpie-singing.riv`

本工程已经支持通过切换 `riv` 路径重新加载独立文件。

## 小喜鹊分层

```text
root
├─ body
├─ face
│  ├─ eye_left / pupil_left / highlight_left
│  ├─ eye_right / pupil_right / highlight_right
│  └─ beak_upper / beak_lower
├─ belly
├─ wing_left
├─ wing_right
├─ leg_left / foot_left
├─ leg_right / foot_right
└─ tails
   ├─ tail_01
   ├─ tail_02
   └─ tail_03
```

尾羽用三条独立骨骼链做 2–3 帧的滞后，翅膀以肩部为旋转中心；眼睛只做轻微眨眼与视线变化，避免过强弹性破坏原 IP 的温和感。

## 动画节奏

- 八段锦：4.0–4.8 秒循环，缓入缓出；举翼顶点停留约 0.4 秒。
- 浅马步：3.2–4.0 秒循环；下降和起身各约 0.8 秒，最低点仅做浅蹲。
- 唱歌：2.8–3.6 秒循环；喙部开合 2–3 次，音符低速上浮。
- 打卡：0.7–1.0 秒单次播放；一次放大回弹、3–5 个星点，无高频闪烁。

健康场景需要避免快速频闪、剧烈抖动和持续大幅缩放；同时保留 `reducedMotion` 输入，以便无动画或弱动画模式。

## 平台实现

| 平台 | 实现 | 说明 |
|---|---|---|
| H5 | `@rive-app/canvas-single` | 单文件 WASM，部署最直接 |
| UniApp App（Vue 页面） | renderjs + Rive Canvas | Rive 在 WebView 渲染层运行 |
| 微信小程序 | 原生 `rive-view` + `WXWebAssembly` | 必须真机验证；运行库位于 `src/wxcomponents/rive-view` |
| 全平台备用 | MP4 + 分帧 PNG | `.riv` 不可用时仍可交付视觉效果 |

微信运行库是社区实现，功能比官方 Web Runtime 少，不支持文本布局、音频、Yoga 布局和 Luau。正式 Rive 文件应尽量只使用矢量路径、基础骨骼、约束和简单状态机。

## 验收清单

- 三个平台切换动作后画面立即更新，视频或状态机不会叠播。
- 返回后台时暂停，返回前台时恢复；销毁页面时释放 Rive 实例。
- iPhone/Android/至少一台微信真机检查 30fps 和内存。
- 小程序主包体积检查；如后续资源变大，把 Rive 运行库迁入独立分包。
- 关闭动画或系统“减少动态效果”时，打卡庆祝保持静态可读。

