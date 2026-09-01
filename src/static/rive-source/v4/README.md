# Rive V4 角色资产重建规范

## 唯一母版

- 喜鹊：`IP设计/最终选稿（喜鹊）/11-紫色小喜鹊-平面数字伙伴版.png` 顶部大图。
- 女孩：`IP设计/最终选稿（小人）/02-双辫女孩-多色服装-IP设定.png` 顶部大图。
- 年长女性：`IP设计/最终选稿（小人）/04-成年女性健康伙伴-长者友好版.png` 顶部大图。
- 其他表情和动作只作为姿势参考，不作为第二套比例母版。

> 源目录中没有 SVG/AI/EPS 原文件，所以 V4 采用“关键件真矢量 + 主体图像网格”的 Rive 混合结构，不把整张 PNG 当作一块平面贴图继续动画。

## 已产出的 V4 拆件

- `master/magpie-neutral-master-v4.png`：真实 Alpha 透明、无投影的骨骼母版。
- `vector/magpie-eye-module-v4.svg`：左右眼分开的眼白、虹膜、瞳孔、高光、上下眼睑和眼睫毛。
- `parts/*.png`：主体、喙、双脚、双翅、两片尾羽共 8 个透明切片；关节边缘保留防露缝重叠区。
- `parts/rig-parts-manifest.json`：每个切片的原画坐标、Rive 对齐偏移、局部/画布关节轴心和绘制顺序。
- `previews/magpie-cut-rig-parts-v4.png`：拆件总览图。
- `eye-module-spec.json`：视线、眨眼、眯眼和表情参数。
- `parts-manifest.json`：导入命名、网格策略和验收门槛。

## 当前 Rive 编辑器实况（2026-09-01）

- 云端编辑文件：`Untitled`；画板：`Artboard`。
- 已导入：透明母版、眼睛 SVG、`body_core`、`beak`、`foot_L`、`foot_R`、`wing_far`、`wing_near`、`tail_upper`、`tail_lower`。
- 已放入画板并对齐：眼睛 SVG、`wing_far`、`wing_near`、`tail_upper`、`tail_lower`；主体切片、喙和双脚仍作为素材待替换整张母版。
- 近侧翅膀肩关节原点：`19.7%, 24.5%`；位置：`261.6, 312.6`；比例：`40%`。
- 当前真实动画：`Timeline 1`。双眼为上下眼睑闭合；近侧翅膀包含 5 个旋转关键帧，与眨眼在同一时间轴同步播放。
- 当前状态机：`State Machine 1`，结构为 `Entry → Timeline 1`，暂无输入参数。
- 运行时 `.riv` 尚未从当前 Beta 编辑器导出；本目录是可重建、可核验的源资产包，不能把它误称成已经交付的 `.riv`。

## 喜鹊层级

```text
MagpieRoot
├── BodyRoot
│   ├── tail_back_L
│   ├── tail_back_R
│   ├── body_shell
│   ├── belly_patch
│   ├── face_patch
│   ├── leg_L / foot_L
│   └── leg_R / foot_R
├── wing_L
├── wing_R
├── EyeRig
│   ├── eye_L_clip
│   │   ├── sclera_L
│   │   ├── iris_L
│   │   ├── pupil_L
│   │   └── highlight_L
│   ├── eye_R_clip
│   │   ├── sclera_R
│   │   ├── iris_R
│   │   ├── pupil_R
│   │   └── highlight_R
│   ├── upper_lid_L / lower_lid_L / lash_L
│   └── upper_lid_R / lower_lid_R / lash_R
└── BeakRig
    ├── beak_upper
    └── beak_lower
```

## 眼睛验收规则

- 左右眼分别使用独立裁切区域，虹膜不能跑出眼白。
- 两颗眼睛共享 `gazeX`、`gazeY`，但保留不同的局部位移系数以适配三分之四视角。
- 眨眼由上下眼睑闭合完成，不对整颗眼睛做 Y 轴压缩。
- 高光与虹膜联动，眼睫毛和眼白不跟随视线移动。
- 默认视线保持和最终选稿一致，不能变成正面“斗鸡眼”或双眼完全平行。

## 骨骼与控制器

- 喜鹊：`bird_root`、`body`、左右翅、两根尾羽、双腿、上下喙、左右眼控制器。
- 人物：`root → hip → spine → chest → neck → head`，双臂与双腿各两节，并配置 IK 目标。
- 次级运动：尾羽延迟、辫子延迟、头发延迟、呼吸缩放、落地挤压回弹。

## 三套动画

1. `baduanjin_main`：年长女性与喜鹊同步下沉、抱球、开肩、托天、回落，6.8 秒循环。
2. `resistance_main`：女孩浅蹲，喜鹊在手掌蓄力、起跳、腾空、回落、庆祝，6 秒循环。
3. `singing_flight_main`：开唱蓄力、展翅、飞出画板、右上回场、重落地、英雄定格，5.2 秒循环。

## 状态机

- 名称：`MotionMachine`
- 输入：`motion`（Number：0 待机、1 八段锦、2 抗阻、3 唱歌）、`play`（Boolean）、`replay`（Trigger）、`celebrate`（Trigger）、`reducedMotion`（Boolean）。
- 动画状态：`Idle`、`Baduanjin`、`Resistance`、`SingingFlight`、`Celebrate`、`Reduced`。
- 所有主状态切换使用 180–300 ms 混合；完成打卡通过 `celebrate` 触发一次性高冲击庆祝动画。

## 执行顺序

1. 【已完成】重新矢量化双眼；输出透明 SVG/PNG 拆件并做像素检查。
2. 【已完成】把 8 个身体切片导入 Rive；双翅和尾羽已作为独立图层对齐。
3. 【进行中】用 `body_core`、喙、双脚替换整张母版，建立根骨、肩关节、尾根和足部控制器。
4. 【待完成】创建 `MotionMachine` 输入与八段锦、抗阻、唱歌飞出、打卡庆祝四条主时间轴。
5. 【待完成】导出 `.riv`，分别在 uni-app 的微信小程序与 App 运行时验证。
