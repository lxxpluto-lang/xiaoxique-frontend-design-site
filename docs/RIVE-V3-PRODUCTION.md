# Rive 骨骼动画 V3 制作规范

V3 不再把分镜图直接合成为视频。角色全部拆成透明部件，在 Rive 中通过骨骼、父子层级、关键帧缓动和状态机连续驱动。

## 已准备的输入

- `src/static/rive-source/v3/parts/magpie/`：小喜鹊 16 个部件。
- `src/static/rive-source/v3/parts/girl/`：双辫女孩 16 个部件。
- `src/static/rive-source/v3/parts/woman/`：年长女性 16 个部件。
- `src/static/rive-source/v3/atlases/*-clean.png`：清理后的完整透明拆层图。
- `src/static/rive-source/v3/asset-index.json`：部件名称、路径与尺寸。
- `src/static/rive-source/v3/binding-map.json`：每个部件对应骨骼、旋转轴、遮挡顺序和网格绑定方式。
- `src/static/rive-source/v3/rig-blueprint.json`：骨骼树、状态机、三条动作时间线、飞行路径与运行时摆放方式。

## 输出文件

Rive Desktop 完成绑定后分别导出：

- `src/static/rive/magpie-baduanjin-v3.riv`
- `src/static/rive/magpie-resistance-v3.riv`
- `src/static/rive/magpie-singing-v3.riv`

三个文件统一使用状态机名称 `Motion Machine`，输入为：

- `play`：布尔值，控制主循环。
- `replay`：触发器，重复点击当前运动时从蓄力段重新开始。
- `celebrate`：触发器，播放一次奖励动作。
- `reducedMotion`：布尔值，切换到低动态版本。

## Rive 绑定顺序

1. 新建 720 × 600、60fps Artboard，背景保持透明。
2. 按 `asset-index.json` 导入对应 PNG，禁止把角色重新合并成单张图片。
3. 按 `rig-blueprint.json` 创建骨骼树并设置父子关系。
4. 将手臂、前臂、腿、翅膀和尾羽的 Origin 移到真实关节位置。
5. 人物使用 `root → hip → spine → chest → neck → head` 主链；四肢从 `chest` 和 `hip` 分出。
6. 小喜鹊使用 `bird_root → bird_body` 主链；双翼、双尾、双脚、喙和双眼分别挂接。
7. 先做 `idle` 呼吸循环，再制作 `main_loop`，最后制作 `celebrate_once`。
8. 相邻关键帧必须使用连续缓动，禁止使用透明交叉淡化代替位移或旋转。
9. 唱歌文件放在页面级透明 Rive 画布中，不放进视频卡片裁切区域，才能真正飞出界面。

## 动作节奏

- 八段锦：6.8 秒，一个连续镜头；蓄力、抬手、托天过冲、稳定、回落完整保留。
- 抗阻运动：6 秒；浅蹲蓄力、小喜鹊起跳、抛物线、落掌压缩、回弹与庆祝。
- 唱歌：5.2 秒；开唱、高潮、起飞、离场空镜、右上回场、落地和英雄收尾。

详细毫秒时间点、缓动曲线和飞行坐标均在 `rig-blueprint.json` 中。

## 当前编辑状态

本机 Rive Desktop 已安装，并已通过 Google 登录。透明部件、骨骼树、关键帧节奏和 UniApp 状态机接口均已准备完成；桌面进入系统锁屏后，Rive 画布编辑暂停在新建文件之前，解锁即可继续导入、绑定和导出 `.riv`。
