# 本地资源与包体依赖审计

仅生成报告；原项目、副本素材、编译产物均未删除、转码或外传。这里是文件逻辑大小，不是平台压缩上传包测量，也不引用未核验的平台限额。

## 实测总量

| 范围 | 文件数 | 逻辑大小 |
|---|---:|---:|
| src/static | 236 | 126.73 MiB |
| src/wxcomponents | 13 | 0.31 MiB |
| dist/build/mp-weixin | 335 | 127.47 MiB |

## 静态资源分组

| 目录 | 文件数 | 总大小 | 有字面引用 | 动态前缀候选 | 未找到字面引用 |
|---|---:|---:|---:|---:|---:|
| videos | 13 | 53.03 MiB | 39.40 MiB | 0.00 MiB | 13.63 MiB |
| replica | 20 | 22.71 MiB | 22.71 MiB | 0.00 MiB | 0.00 MiB |
| backgrounds | 7 | 14.02 MiB | 0.00 MiB | 0.00 MiB | 14.02 MiB |
| frames | 36 | 10.28 MiB | 0.00 MiB | 0.00 MiB | 10.28 MiB |
| storyboards | 6 | 9.38 MiB | 0.00 MiB | 0.00 MiB | 9.38 MiB |
| sprites | 27 | 7.83 MiB | 0.00 MiB | 0.00 MiB | 7.83 MiB |
| rive-source | 74 | 6.44 MiB | 0.82 MiB | 0.00 MiB | 5.62 MiB |
| previews | 9 | 2.01 MiB | 0.33 MiB | 0.00 MiB | 1.67 MiB |
| overlays | 1 | 0.76 MiB | 0.00 MiB | 0.00 MiB | 0.76 MiB |
| knowledge | 3 | 0.22 MiB | 0.22 MiB | 0.00 MiB | 0.00 MiB |
| icons | 38 | 0.03 MiB | 0.01 MiB | 0.02 MiB | 0.01 MiB |
| logo.png | 1 | 0.00 MiB | 0.00 MiB | 0.00 MiB | 0.00 MiB |
| rive | 1 | 0.00 MiB | 0.00 MiB | 0.00 MiB | 0.00 MiB |

## 解释与下一步边界

- “有字面引用”包含注释、不可达分支、禁用配置，不代表每个文件已在浏览器加载；具体行号和hash见JSON。
- “未找到字面引用”只是待审候选，不能直接删除：动态拼接、运行库内部引用、构建复制规则和历史源资产须逐类核对。
- rive-motion.ts中的三个.riv路径对应enabled:false；当前使用原MP4回退。不能把缺少尚未启用的.riv描述成训练视频404，也不能擅自开启。
- pages.json仍声明rive-view；运行库随微信构建复制，需与素材大小分别核对。Rive源图中的紫喜母版仍被界面引用，不能整目录剔除。
- 先建立分发白名单并在独立产物中验证所有运行请求，再决定排除历史源资产；保留原项目及副本全量素材以便恢复。
- 训练与知识视频需要保留原时长/内容。远程托管需要用户控制的域名、存储和平台配置，不允许擅自上传、用外部视频替换或为了包体删除课程。
- 此报告不证明小程序可上传、真机性能、动态资源全部可达或最终分包方案已实现。

## 体积最大的20项静态资源

| 文件 | 大小 | 分类 |
|---|---:|---|
| src/static/videos/baduanjin-full-course-mobile.mp4 | 38.55 MiB | literal-reference |
| src/static/videos/magpie-card-switch-showcase-cute-v2.mp4 | 3.59 MiB | no-literal-reference-found |
| src/static/videos/magpie-card-switch-showcase-v1.mp4 | 3.59 MiB | no-literal-reference-found |
| src/static/videos/card-switch-showcase-v1.wav | 2.89 MiB | no-literal-reference-found |
| src/static/backgrounds/card-switch-v1/resistance-premium-v1.png | 2.27 MiB | no-literal-reference-found |
| src/static/storyboards/baduanjin-cinematic-v2.png | 2.16 MiB | no-literal-reference-found |
| src/static/backgrounds/card-switch-v1/singing-premium-v1.png | 2.14 MiB | no-literal-reference-found |
| src/static/backgrounds/card-switch-v1/baduanjin-premium-v1.png | 2.08 MiB | no-literal-reference-found |
| src/static/storyboards/singing-cinematic-v2.png | 2.05 MiB | no-literal-reference-found |
| src/static/backgrounds/card-switch-v1/singing-cute-v2.png | 2.03 MiB | no-literal-reference-found |
| src/static/backgrounds/card-switch-v1/resistance-cute-v2.png | 1.99 MiB | no-literal-reference-found |
| src/static/backgrounds/card-switch-v1/baduanjin-cute-v2.png | 1.93 MiB | no-literal-reference-found |
| src/static/storyboards/resistance-cinematic-v2.png | 1.92 MiB | no-literal-reference-found |
| src/static/replica/buddy-friends.png | 1.69 MiB | literal-reference |
| src/static/replica/social-friends.png | 1.61 MiB | literal-reference |
| src/static/backgrounds/card-switch-v1/unified-health-island-v3.png | 1.59 MiB | no-literal-reference-found |
| src/static/replica/reward-notebook-v1.png | 1.56 MiB | literal-reference |
| src/static/replica/tree-mature.png | 1.51 MiB | literal-reference |
| src/static/replica/onboarding-shoe-v1.png | 1.36 MiB | literal-reference |
| src/static/sprites/continuous-v3/resistance-sprite-sheet-v3.png | 1.36 MiB | no-literal-reference-found |

## 未落盘的字面路径

- /static/rive/magpie-baduanjin-v3.riv：declared-rive-source; inspect enabled guard, not automatic missing-runtime failure
- /static/rive/magpie-resistance-v3.riv：declared-rive-source; inspect enabled guard, not automatic missing-runtime failure
- /static/rive/magpie-singing-v3.riv：declared-rive-source; inspect enabled guard, not automatic missing-runtime failure

[逐文件hash、来源与大小](resource-audit.json)

## 独立分发证据

本审计本身仍只读；独立白名单、保留/排除记录、逐文件验证与生产H5测试已单独生成。来源全量资源未删除；具体当前状态见[分发记录](runtime-delivery.md)及[总验收报告](../../REPLICA-REVIEW.md)，不把约60MiB的运行副本等同平台可发布包。
