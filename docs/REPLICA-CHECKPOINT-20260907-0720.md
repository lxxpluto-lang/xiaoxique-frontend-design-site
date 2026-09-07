# 续接检查点：独立分发、生产外链修复与双环境验证

本轮分类：真实进展。全goal仍active，未达到完整视觉复刻/平台验收，不调用complete/blocked。用户已授权副本实施；源项目和效果图目录只读。没有提交、推送、部署、上传CDN、真实医疗/设备/支付/消息操作。没有需要用户回复才能继续的阻断。

## 当前权威与环境

- 写入目标：小喜鹊精简功能版-原型副本；基线仍为相邻小喜鹊精简功能版，c1b56ff43a94c0e7e096bb80f0f19f998673a48c，工作区clean。
- 开发服务：http://127.0.0.1:4173/。
- 独立生产服务：http://127.0.0.1:4183/，本轮最后启动句柄26787（Vite preview，指定下方h5目录）；续接先确认句柄/监听，不因无新日志就重启。旧服务59353/86584对应旧分发已主动停止。
- 当前分发：`dist/runtime-delivery/run-4hQ7CX/{h5,mp-weixin,app}`。不要用旧run-oA3kwi或run-3Jqvas做当前结果；旧目录保留未删。
- 当前manifest hash：57bcfb61c0fbf4d6562f322fd0a4b6f34c852fb741b16da005d0deb68b5d0cd4。入口记录`docs/visual-acceptance/latest/runtime-delivery.json`与run目录manifest一致。

## 新实现与实际修复

1. `scripts/replica-runtime-delivery.cjs`：源+三端编译字面引用取并集，完整动态icons前缀保留，选中SVG/CSS本地依赖闭包。仅3条当前明确enabled:false的缺失Rive声明允许记录为未启用；原MP4保留。构建必须通过且不早于源码修改。
2. 新建独立run目录，所有非static代码/配置/原生组件保留；61项静态素材保留，171项未纳入分发，但源及原编译全量保留。逐文件hash核验；没有删除、转码、图像压缩、改变视频内容或替换外链。
3. `scripts/replica-delivery-qa.cjs`5项：三端307个保留文件与原构建同hash；232原素材及原编译排除项仍在；H5全部67文件HTTP实际字节同hash；6视频Range0–1023字节相同；排除素材不能从全量目录回落。Vite未知图片URL可能返回200首页HTML，测试必须验证确切首页hash/type，不能误判为历史图片仍在或认为200就是图片可用。
4. `scripts/replica-qa-config.cjs`：允许独立loopback服务及visual-acceptance内独立输出。main browser/catalog/keyboard/gallery已接入；默认仍4173/latest。生产H5的全局uni没有getStorageSync，不改应用暴露API，测试依据安装框架真实`{type,data}`封装读写可丢弃上下文。原恢复逻辑仍在刷新后执行。
5. FIX-008：生产框架body::after的shadow-preload会请求cdn.dcloud.net.cn/img/shadow-grey.png并产生ERR_CONNECTION_CLOSED。H5 App.vue限定`html body::after`关闭这项屏幕外装饰预加载。没有网络拦截/屏蔽错误，真实请求记录已测无外部请求。原uniStatistics已为false，此问题不是统计接口，不要误改manifest。
6. 主浏览器新增请求失败URL/原因及外部请求记录；任何控制台错误、HTTP错误、非ERR_ABORTED网络失败、外部请求都使exit非0。修复旧脚本仅检查交互断言而忽略errors数组的退出状态。catalog错误也参与退出。
7. FIX-009：生产P05未选中周期标签#57766c在#e3f3ed上对比度4.35，三尺寸3条；开发版未暴露。只加深为#48685d，周期/聚合/布局不变。最终重新编译、重新分发、两环境截图复测后均为0低纯色对比度项。
8. review/resource报告脚本已纳入独立分发证据；不能把生产重复35项与开发78项简单合并为更多产品覆盖。主提示词/细则第10节/DEC/差异表已同步。

## 最终证据（代码最后一处颜色修改之后）

- type-check、Rive、H5、mp-weixin、App全部通过；最后完成时间2026-09-06T23:15:19.804Z。
- 开发版：browser19、state16、boundary9、layout14、catalog8、accessibility4、keyboard8，78PASS/0FAIL/0运行异常。主browser23:16:20Z，0HTTP错误/0外部请求/0非取消网络失败。
- 独立生产版：文件5PASS；browser19、catalog8、keyboard8共35PASS/0FAIL/0异常。主browser23:17:19Z，0HTTP错误/0外部请求/0非取消网络失败。
- 两环境各28页/84尺寸，均无容器横向溢出；smallText0、smallTargets0、lowPlainContrast0。渐变/图片等仍有不可推断项，不代表完整WCAG。生产版原先的3项周期文字问题已在最终测量中消失。
- 开发图册在latest，独立生产图册在runtime-delivery，各自是真实本环境截图；已更新全部28张三栏对照。生产P05截图已打开复核。旧失败图归档diagnostic-history，没有作为最终通过证据。
- parity83原锚点→180，原123命名函数保留，仅既有closeDetail反馈命名差异；原216素材无缺失或改动；prototype-data/shared-patient/rive-motion/pages/manifest/package六文件同hash。git diff --check通过。
- 最终逻辑字节：H5 132036707→65752597（238→67文件）；mp 129517416→63233306（331→160）；App132624321→66340211（251→80）。每端减少66284110字节约63.21MiB；mp约123.52→60.30MiB。不是平台压缩上传包大小。
- QA配置拒绝外部URL/输出目录逃逸及默认环境两个即时单测通过；这些不计入78或35。

## 下一步未完成工作（不要重跑已经完成的资源审计当进展）

1. **视觉剩余差异**：逐页插画/图标/卡片高度/首屏密度，尤其训练暂停的小喜仍站立而非参考休息姿态，以及若干人物/布局差异。阅读visual-diff-report并实际打开目标参考+运行图，推进可复刻但尚未完成的视觉，而不是只继续写清单。功能必要差异不应删除。
2. **平台分包/可发布包**：独立包仍约60MiB，未实现正式分包/视频分发策略，不宣称可上传。必须保留完整728秒课程/原内容，不能擅自CDN上传或删课程。若写限额，先核验官方最新证据；若需要新的外部授权，报告准确边界，但本地视觉仍有安全工作可做。
3. **完整无障碍与真机**：整站焦点顺序、读屏、软键盘、触控、原生权限/性能/相机、正式Rive资产仍有未证明项。H5 8项键盘通过不是整站关闭。
4. 完整full/handoff门禁、用户视觉签收尚未关闭；状态REVIEW_COMPLETE_WITH_GAPS。不要将77/78/35计数当最终成功条件。

## 文件入口

- `docs/REPLICA-REVIEW.md`
- `docs/visual-acceptance/latest/runtime-delivery.md`
- `docs/visual-acceptance/latest/runtime-delivery-validation.json`
- `docs/visual-acceptance/runtime-delivery/全部28页-运行与参考对照.html`
- `docs/visual-acceptance/latest/visual-diff-report.md`

本轮结束时没有未完QA进程；4173/4183是供查看的本地服务。续接以实际监听和当前manifest为准。
