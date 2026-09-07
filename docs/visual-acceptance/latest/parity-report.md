# 功能静态等价性核对

原项目 c1b56ff43a94c0e7e096bb80f0f19f998673a48c；工作区 clean。

静态锚点 83 → 182，缺失 0。主状态文件原函数 123 → 123，缺失 0。

函数实现有变动：closeDetail。原静态资源缺失 0，原资源内容被改动 0。

| 核心文件 | 完全一致 |
|---|---|
| src/lib/prototype-data.ts | 是 |
| src/lib/shared-patient.ts | 是 |
| src/lib/rive-motion.ts | 是 |
| src/pages.json | 是 |
| src/manifest.json | 是 |
| package.json | 是 |

静态检查不证明所有动作运行正确；需合并浏览器记录、状态故障注入与视觉对照。
