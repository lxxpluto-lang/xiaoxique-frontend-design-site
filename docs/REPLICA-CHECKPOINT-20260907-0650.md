# 续接检查点：H5键盘与最终回归

全目标仍为active；本轮有实际进展，不标记complete/blocked。用户授权本地副本实施，功能冲突以只读本地原项目为准。未修改原项目/效果图目录/远端，没有提交、推送、部署或真实设备/医院/支付/消息操作。当前没有需要用户回复才能继续的阻断。

## 本轮落地

- H5键盘适配器`src/lib/prototype-keyboard.ts`：补充按钮/开关语义、Enter/Space、评分方向/Home/End、处方轮播、非当前卡inert、弹窗安全默认焦点/Tab约束/Escape/回焦点/背景锁。只调用原click和onPrescriptionSlide，不另建业务数据。
- `H5KeyboardDate.vue`仅H5导入，公众档案保留原Uni指针picker，键盘增强原生date；同一setPublicBirthDate及原save校验。实际测试pointer打开/取消与键盘fill保存/拒绝未来日期。未声称日期所有物理键组合已测。
- 关键FIX-007：Uni的document keyup会把打开兑换弹窗的Enter松键当确认。适配器消耗已处理Enter/Escape松键，抑制长按重复激活。测试明确断言打开无扣分/无记录、取消不扣分、显式确认500→450且只新增一条。
- 原策略6字段开关、评分滑杆与弹窗标签从源数据声明；原始disabled社交入口保持禁用，4处方非当前卡不参与Tab。
- 原生输入/视频不抢键；H5focus-visible描边；日期布局wrapper防止双边框。没有新增医学阈值或修改奖励、审核函数。
- `replica-keyboard-qa.cjs`8场景。`replica-parity.cjs`只统计Vue模板属性和显式渲染函数字面prop，不把querySelector拼接误计成静态锚点。
- 边界回归曾失败：测试取消弹窗后，在关闭动画/背景inert释放前fill邀请码。现等待实际modal隐藏和背景解锁，并断言真实输入值；没有强制点击、禁用断言或业务改动，重跑9项全过。失败截图可恢复，已归档diagnostic-history。
- 主提示词、细则第11节、决策UI-018/019、FIX-007和视觉差异已同步。细则37个本地链接实查无缺失。

## 最终已执行证据

- browser19、state16、boundary9、layout14、catalog8、accessibility4、keyboard8：合计78项PASS、0FAIL、7组运行异常0。不是78条完整产品验收。
- 浏览器主回归2026-09-06T22:44:21Z；边界22:46:49Z；最终键盘22:47:59Z。主浏览器资源HTTP>=400为0。
- 28个参考状态/84尺寸组合无容器横向溢出；readability84测量smallText0、smallTargets0、lowPlainContrast0、unverifiedContrast831。831含三尺寸重复，非831独立缺陷，不代表完整WCAG。
- type-check、test:rive-runtime、build:h5、build:mp-weixin、build:app全通过；本轮键盘代码定稿后构建。后续仅测试/文档修改。git diff --check通过。
- 构建文件静态核查：`keyboard-date-input`及适配器独有字符串`uni-modal,.uni-picker-container`只在H5产物，mp/App均无。`data-keyboard-proxy`普通属性仍可出现在其他平台，不把它误判为DOM模块泄漏。
- parity原83锚点全保留，现180；123原命名函数保留，仅closeDetail既有植物反馈命名变化；原216资产无缺失/覆盖；6核心文件同hash；原项目clean，提交c1b56ff43a94c0e7e096bb80f0f19f998673a48c。此为本地基线核对，不声称远端最新HEAD已查。
- resource：src/static232文件128740672字节，wxcomponents13文件329940字节，mp编译331文件129517416字节。没有精简分发或删除/转码资产。
- 图册28个三栏对照已刷新；总报告已合并键盘8项、异常和notProven，旧失败图归档。焦点截图和日期错误截图已实际打开检查，日期截图无前一次成功Toast遮挡。
- H5服务最后HTTP200：http://127.0.0.1:4173/。

## 下一步仍有意义的安全工作

1. 资源审计推进到独立分发白名单及验证；先梳理动态图标、紫喜母版、原训练/知识视频、Rive回退和原生组件。保留源与副本全量资源，不擅自上传CDN或删除课程。发布包限额若需要数值，先核验平台官方最新要求。
2. 逐页还存在插画/图标/密度/留白差异，见visual-diff-report；必要功能差异不可为了叠图重合而删改。
3. 渐变/图片背景的对比度、整站焦点顺序/读屏、日期物理键分段、真机软键盘/触控/权限/性能仍未证明。REV-A11Y-002为部分修复而非整个无障碍关闭。
4. 不再重复从零写提示词或覆盖已实现组件；主提示词和细则已记录当前断点。用户后续若仅要求文字，交付文档；当前active goal仍授权副本实施。
5. 完整交付门禁、视觉签收及平台发布未关闭，状态保持REVIEW_COMPLETE_WITH_GAPS，不能写gaps=none。

## 输出入口

- `docs/REPLICA-REVIEW.md`
- `docs/visual-acceptance/latest/全部28页-运行与参考对照.html`
- `docs/visual-acceptance/latest/keyboard-run.json`
- `一次跑完-功能保真与高保真复刻主提示词.md`
- `docs/复刻执行细则与证据清单.md`
