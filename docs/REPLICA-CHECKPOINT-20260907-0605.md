# 续接检查点：全页可读性、点击区域与资源依赖

全目标仍在进行，不标记complete/blocked。用户要求本地功能优先、按28图升级；只修改原型副本，不改原项目/参考目录/远程。当前没有需要用户回复才能继续的阻断。

## 已完成的本轮工作

- 所有显式小于23rpx字号提高至23rpx，App caption/nav tokens同步。浅底说明文字按实际背景加强；白字按钮/步骤数字/已完成徽标使用更深绿色。全绿方向、紫色小喜、无奖杯、树无土盆台保留。
- 全局按钮/输入44px，局部较小按钮min-height升92rpx。页头按钮92rpx，页头124rpx，同步更新移动/桌面detail-scroll扣减。头像92rpx。H5开关/滑条44px扩展区实测上下边缘能改变原值。
- 放大控件后发现普通处方卡裁切：普通/附医生说明轮播440/524rpx，4项三宽度重新通过。不是隐藏溢出或删字段。
- H5 Uni默认display:block覆盖普通全局样式：增加uni-page-body uni-button的默认flex，组件grid/显式布局仍优先；text-button显式flex。策略页签及返回文字实际中心偏差<4px。此处已反复实测，勿再无证据改回。
- 新增replica-readability-audit.cjs：v2包括UniText内部span；测量渲染DOM含滚动区下面内容。隐藏/禁用排除，渐变/图片/opacity/filter不误判纯色。主browser脚本每个参考页三宽度保存readability-run.json。
- 新增replica-accessibility-qa.cjs，4项：审计器自测、6开关边缘/按钮垂直居中、前评分滑杆边缘0/10、助手输入/启用发送三尺寸。
- 新增replica-resource-audit.cjs：只读逻辑字节/hash/字面引用/动态前缀；没有删除、转码、复制分发或上传素材。约63.21 MiB资源没有找到字面引用，但只是待审候选，不能直接删除。
- 总报告生成器合并6组测试与可读性/资源证据，差异表和决策记录UI-016/017、FIX-005/006与开放REV已更新。

## 最终本轮实测（最终App样式之后重新执行）

- browser19、state16、boundary9、layout14、catalog8、accessibility4：合计70项PASS，0FAIL/0运行异常。不是70条完整产品验收。
- 主browser0 HTTP>=400，28参考页/84三尺寸组合无容器横向溢出。
- readability generatedAt=2026-09-06T22:03:45.319Z：84测量，smallText0、smallTargets0、lowPlainContrast0；unverifiedContrast831（三尺寸重复计数，非831独立缺陷）。不能宣称整体WCAG通过。
- 字号修改后、触控/颜色修改前快照：docs/visual-acceptance/readability-before-controls-20260907.json。该快照smallText0、smallTargets333、lowPlainContrast954；不是字号修改前原始基线。
- TypeScript/Rive/H5/mp-weixin/App全部本地检查通过，git diff --check通过。截图已实际打开复核首页/前检查/助手/策略/资讯；图册重新生成。
- parity：基线c1b56ff43a94c0e7e096bb80f0f19f998673a48c，原目录clean；原83锚点全保留/现178，123命名函数保留，原216资源未缺失或覆盖，6核心文件完全同hash。
- 最终资源逻辑大小：src/static=128740672字节/232文件；src/wxcomponents=329940字节/13文件；mp输出=129515876字节/331文件。与du显示123M/146M不同口径，不能混用。3个.riv未落盘但原enabled:false，仍走MP4。

## 下一轮有意义的安全工作（尚未完成）

1. 修复H5键盘焦点/激活与语义：已实际发现uni-button tabIndex=-1、role=null。建立合适按钮/开关/滑杆的语义、键盘动作、模态焦点管理；注意轮播隐藏卡不应进入顺序。不要仅注入ACT锚点假称完成。该缺口可本地处理，不要说外部阻断。
2. 把资源审计推进到独立分发产物白名单与验证；先梳理动态icons、Rive母版、原3训练+3知识视频与运行库，保留原项目和副本全量素材。不能擅自CDN上传/删课程/覆盖原字典或模板；真实平台包体限制需核验官方资料后才能写数值。
3. 渐变/图片背景、软键盘/读屏、真机与逐页仍存在的插图/密度差异。区别必要功能冲突与确实未完成的视觉细节，见visual-diff-report。
4. 完整交付门禁/人类签收尚未关闭，不能写gaps=none。安全本地工作仍可继续，goal非blocked。

## 入口

- H5：http://127.0.0.1:4173/，既有服务仍运行。
- 图册：docs/visual-acceptance/latest/全部28页-运行与参考对照.html。
- 总报告：docs/REPLICA-REVIEW.md，状态REVIEW_COMPLETE_WITH_GAPS。
- 本轮没有新生成图片；只改样式/测试/报告，业务字典、角色/处方/奖励/审核函数保持。
