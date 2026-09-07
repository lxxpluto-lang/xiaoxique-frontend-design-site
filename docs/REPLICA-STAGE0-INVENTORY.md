# UI 复刻 Stage 0 盘点

生成：2026-09-06T16:54:57.257Z

- 功能权威：只读原项目，提交 c1b56ff43a94c0e7e096bb80f0f19f998673a48c。
- 目标副本提交：c1b56ff43a94c0e7e096bb80f0f19f998673a48c。
- 原项目工作区：clean。
- Node：v25.4.0。
- 改造前 type-check、test:rive-runtime（2/2）、build:h5 均已通过。Sass legacy API 弃用警告不影响构建。
- 原始运行截图：visual-acceptance/before/。
- 完整机器清单：REPLICA-STAGE0-INVENTORY.json（资源、字段、处理器、锚点、文件 hash）。

## 冲突裁决

- DEC-CONFLICT-001：本地源代码行为优先于提示词与效果图中的推测。真实处方、时长、6000 步目标、数据来源、奖励资格、社交开关、医生审核规则均继承。
- DEC-CONFLICT-002：hospital-report 在类型中存在但无页面实现；增加康复小报告是本次明确新增，不声称它是已存在功能。
- DEC-CONFLICT-003：图中文字/数字不写死。图中运动选择/数据命名与现有导航不一致时，保留原导航 ID 和功能，视觉使用同一布局语言。
- DEC-CONFLICT-004：旧花园种植小白菜的计数规则保留，展示名与插画更新为小树；7 个有效训练日一轮、不倒退、不重复成长不变。
- DEC-CONFLICT-005：图中未在基线存在的搜索、报告分段入口等属于表现层增强；必须标注新增并做到可用。不能依据图新增真实医院/设备/支付/消息。

## 状态和字典

- UserMode：cardiac, public
- NavId：today, discover, assistant, data, profile
- ExerciseCategoryId：traditional, aerobic, strength, mobility, recovery
- ExerciseGameId：baduanjin, taichi, walking, power-bike, resistance, stretch, balance, music, breathing
- KnowledgeCategory：recommended, guide, tip, video
- KnowledgeItemType：guide, tip, video
- AssessmentMode：off, optional, required
- DataSource：hospital-device, apple-health, health-connect, manual, demo-device
- DataQuality：valid, stale, missing, denied
- AdviceLevel：stable, attention, stop, insufficient
- ReviewStatus：pending, approved, rejected, maintained
- DetailView：none, precheck, training, postcheck, session-report, garden, training-reports, hospital-report, health-archive, devices, knowledge-article, knowledge-video, reward-store, weekly-path, exercise-category, prototype-policy, doctor-reviews, social-hub
- TrainingStatus：idle, checking, active, paused, stopped, completed

## 28 页覆盖与处置

| 参考图 | 运行视图/状态 | 处置 |
|---|---|---|
| 01-今日首页.png | today | inherit_layout |
| 02-运动前检查.png | precheck | inherit_layout |
| 03-动作跟练.png | training/active | inherit_layout |
| 04-本次运动报告.png | session-report | inherit_layout |
| 05-康复小报告.png | hospital-report | rebuild_interaction |
| 06-训练报告中心.png | training-reports | inherit_layout |
| 07-选择使用方式.png | onboarding/mode | inherit_layout |
| 08-关联康复计划.png | onboarding/binding | inherit_layout |
| 09-运动选择.png | exercise-category | inherit_layout |
| 10-运动后状态.png | postcheck | inherit_layout |
| 11-小喜健康助手.png | assistant | inherit_layout |
| 12-康复资讯.png | discover | inherit_layout |
| 13-知识文章.png | knowledge-article | inherit_layout |
| 14-知识视频.png | knowledge-video | inherit_layout |
| 15-训练数据.png | data | inherit_layout |
| 16-个人中心.png | profile | inherit_layout |
| 17-健康档案.png | health-archive | inherit_layout |
| 18-设备与数据来源.png | devices | inherit_layout |
| 19-本周运动路径.png | weekly-path | inherit_layout |
| 20-运动小菜园-成长.png | garden/growth | inherit_layout |
| 21-运动小菜园-打卡.png | garden/checkin | inherit_layout |
| 22-健康小队.png | social-hub/team | inherit_layout |
| 23-健康搭子.png | social-hub/buddy | inherit_layout |
| 24-健康积分与权益.png | reward-store | inherit_layout |
| 25-训练状态策略.png | prototype-policy | inherit_layout |
| 26-医生审核队列.png | doctor-reviews | inherit_layout |
| 27-安全停止提示.png | training/stop-modal | inherit_layout |
| 28-训练暂停状态.png | training/paused | inherit_layout |

## 现有测试锚点

锚点只能证明定位信息；处理器和运行结果需结合下表与浏览器 ARUN。动态锚点保留原模板，并纳入实际 DOM 验收。

| 锚点 | 来源 | 处置/预期 |
|---|---|---|
| assistant-screen | src/components/AssistantPanel.vue:2 | 保留，沿用关联事件；浏览器结果另验 |
| knowledge-companions | src/components/CompanionHub.vue:2 | 保留，沿用关联事件；浏览器结果另验 |
| knowledge-buddy-entry | src/components/CompanionHub.vue:12 | 保留，沿用关联事件；浏览器结果另验 |
| knowledge-team-entry | src/components/CompanionHub.vue:13 | 保留，沿用关联事件；浏览器结果另验 |
| team-panel | src/components/CompanionHub.vue:16 | 保留，沿用关联事件；浏览器结果另验 |
| create-team | src/components/CompanionHub.vue:22 | 保留，沿用关联事件；浏览器结果另验 |
| join-team-code | src/components/CompanionHub.vue:23 | 保留，沿用关联事件；浏览器结果另验 |
| join-team | src/components/CompanionHub.vue:24 | 保留，沿用关联事件；浏览器结果另验 |
| buddy-panel | src/components/CompanionHub.vue:28 | 保留，沿用关联事件；浏览器结果另验 |
| connect-buddy | src/components/CompanionHub.vue:33 | 保留，沿用关联事件；浏览器结果另验 |
| exercise-primary-cards | src/components/ExerciseCards.vue:2 | 保留，沿用关联事件；浏览器结果另验 |
| discover-content | src/components/KnowledgeHub.vue:2 | 保留，沿用关联事件；浏览器结果另验 |
| rehab-garden-panel | src/components/RehabGardenPanel.vue:2 | 保留，沿用关联事件；浏览器结果另验 |
| garden-section-tabs | src/components/RehabGardenPanel.vue:3 | 保留，沿用关联事件；浏览器结果另验 |
| garden-section-growth | src/components/RehabGardenPanel.vue:6 | 保留，沿用关联事件；浏览器结果另验 |
| garden-section-checkin | src/components/RehabGardenPanel.vue:13 | 保留，沿用关联事件；浏览器结果另验 |
| garden-growth-content | src/components/RehabGardenPanel.vue:24 | 保留，沿用关联事件；浏览器结果另验 |
| region-garden-hero | src/components/RehabGardenPanel.vue:28 | 保留，沿用关联事件；浏览器结果另验 |
| garden-growth-track | src/components/RehabGardenPanel.vue:67 | 保留，沿用关联事件；浏览器结果另验 |
| region-garden-growth | src/components/RehabGardenPanel.vue:86 | 保留，沿用关联事件；浏览器结果另验 |
| garden-cycle-detail | src/components/RehabGardenPanel.vue:99 | 保留，沿用关联事件；浏览器结果另验 |
| garden-checkin-content | src/components/RehabGardenPanel.vue:130 | 保留，沿用关联事件；浏览器结果另验 |
| garden-checkin-summary | src/components/RehabGardenPanel.vue:132 | 保留，沿用关联事件；浏览器结果另验 |
| garden-checkin-calendar | src/components/RehabGardenPanel.vue:147 | 保留，沿用关联事件；浏览器结果另验 |
| garden-recent-checkins | src/components/RehabGardenPanel.vue:182 | 保留，沿用关联事件；浏览器结果另验 |
| training-reports | src/components/TrainingReports.vue:2 | 保留，沿用关联事件；浏览器结果另验 |
| report-tab-daily | src/components/TrainingReports.vue:7 | 保留，沿用关联事件；浏览器结果另验 |
| report-tab-monthly | src/components/TrainingReports.vue:14 | 保留，沿用关联事件；浏览器结果另验 |
| daily-report-list | src/components/TrainingReports.vue:29 | 保留，沿用关联事件；浏览器结果另验 |
| daily-report-row | src/components/TrainingReports.vue:30 | 保留，沿用关联事件；浏览器结果另验 |
| monthly-report-list | src/components/TrainingReports.vue:46 | 保留，沿用关联事件；浏览器结果另验 |
| monthly-report-row | src/components/TrainingReports.vue:47 | 保留，沿用关联事件；浏览器结果另验 |
| onboarding-mode | src/pages/index/index.vue:15 | 保留，沿用关联事件；浏览器结果另验 |
| choose-public | src/pages/index/index.vue:22 | 保留，沿用关联事件；浏览器结果另验 |
| choose-cardiac | src/pages/index/index.vue:35 | 保留，沿用关联事件；浏览器结果另验 |
| onboarding-binding | src/pages/index/index.vue:51 | 保留，沿用关联事件；浏览器结果另验 |
| visit-number | src/pages/index/index.vue:73 | 保留，沿用关联事件；浏览器结果另验 |
| bind-plan | src/pages/index/index.vue:96 | 保留，沿用关联事件；浏览器结果另验 |
| today-screen | src/pages/index/index.vue:118 | 保留，沿用关联事件；浏览器结果另验 |
| today-steps-card | src/pages/index/index.vue:164 | 保留，沿用关联事件；浏览器结果另验 |
| prescription-pagination | src/pages/index/index.vue:209 | 保留，沿用关联事件；浏览器结果另验 |
| prescription-swiper | src/pages/index/index.vue:230 | 保留，沿用关联事件；浏览器结果另验 |
| prescription-slide | src/pages/index/index.vue:236 | 保留，沿用关联事件；浏览器结果另验 |
| today-core-task | src/pages/index/index.vue:241 | 保留，沿用关联事件；浏览器结果另验 |
| today-garden-entry | src/pages/index/index.vue:305 | 保留，沿用关联事件；浏览器结果另验 |
| exercise-category | src/pages/index/index.vue:348 | 保留，沿用关联事件；浏览器结果另验 |
| self-directed-game-list | src/pages/index/index.vue:362 | 保留，沿用关联事件；浏览器结果另验 |
| self-directed-game | src/pages/index/index.vue:367 | 保留，沿用关联事件；浏览器结果另验 |
| selected-self-exercise | src/pages/index/index.vue:386 | 保留，沿用关联事件；浏览器结果另验 |
| start-self-exercise | src/pages/index/index.vue:399 | 保留，沿用关联事件；浏览器结果另验 |
| today-garden-entry | src/pages/index/index.vue:406 | 保留，沿用关联事件；浏览器结果另验 |
| discover-screen | src/pages/index/index.vue:425 | 保留，沿用关联事件；浏览器结果另验 |
| data-screen | src/pages/index/index.vue:470 | 保留，沿用关联事件；浏览器结果另验 |
| daily-steps-card | src/pages/index/index.vue:522 | 保留，沿用关联事件；浏览器结果另验 |
| steps-trend | src/pages/index/index.vue:544 | 保留，沿用关联事件；浏览器结果另验 |
| profile-screen | src/pages/index/index.vue:594 | 保留，沿用关联事件；浏览器结果另验 |
| profile-garden-card | src/pages/index/index.vue:614 | 保留，沿用关联事件；浏览器结果另验 |
| profile-garden-growth | src/pages/index/index.vue:617 | 保留，沿用关联事件；浏览器结果另验 |
| profile-garden-checkin | src/pages/index/index.vue:641 | 保留，沿用关联事件；浏览器结果另验 |
| points-exchange-unavailable | src/pages/index/index.vue:676 | 保留，沿用关联事件；浏览器结果另验 |
| precheck-screen | src/pages/index/index.vue:806 | 保留，沿用关联事件；浏览器结果另验 |
| discomfort-score | src/pages/index/index.vue:816 | 保留，沿用关联事件；浏览器结果另验 |
| precheck-danger-entry | src/pages/index/index.vue:844 | 保留，沿用关联事件；浏览器结果另验 |
| precheck-vitals | src/pages/index/index.vue:853 | 保留，沿用关联事件；浏览器结果另验 |
| read-pre-vitals | src/pages/index/index.vue:864 | 保留，沿用关联事件；浏览器结果另验 |
| enter-pre-vitals-manually | src/pages/index/index.vue:871 | 保留，沿用关联事件；浏览器结果另验 |
| begin-training | src/pages/index/index.vue:945 | 保留，沿用关联事件；浏览器结果另验 |
| training-screen | src/pages/index/index.vue:961 | 保留，沿用关联事件；浏览器结果另验 |
| live-vitals | src/pages/index/index.vue:966 | 保留，沿用关联事件；浏览器结果另验 |
| demo-complete | src/pages/index/index.vue:997 | 保留，沿用关联事件；浏览器结果另验 |
| postcheck-screen | src/pages/index/index.vue:1009 | 保留，沿用关联事件；浏览器结果另验 |
| generate-report | src/pages/index/index.vue:1083 | 保留，沿用关联事件；浏览器结果另验 |
| session-report-screen | src/pages/index/index.vue:1099 | 保留，沿用关联事件；浏览器结果另验 |
| garden-growth-feedback | src/pages/index/index.vue:1132 | 保留，沿用关联事件；浏览器结果另验 |
| manual-steps-card | src/pages/index/index.vue:1284 | 保留，沿用关联事件；浏览器结果另验 |
| manual-steps-input | src/pages/index/index.vue:1303 | 保留，沿用关联事件；浏览器结果另验 |
| save-manual-steps | src/pages/index/index.vue:1310 | 保留，沿用关联事件；浏览器结果另验 |
| public-profile-form | src/pages/index/index.vue:1348 | 保留，沿用关联事件；浏览器结果另验 |
| public-profile-name | src/pages/index/index.vue:1355 | 保留，沿用关联事件；浏览器结果另验 |
| public-profile-birth-date | src/pages/index/index.vue:1369 | 保留，沿用关联事件；浏览器结果另验 |
| public-profile-gender | src/pages/index/index.vue:1390 | 保留，沿用关联事件；浏览器结果另验 |
| public-profile-save | src/pages/index/index.vue:1407 | 保留，沿用关联事件；浏览器结果另验 |
| policy-console | src/pages/index/index.vue:1565 | 保留，沿用关联事件；浏览器结果另验 |
| doctor-review-console | src/pages/index/index.vue:1635 | 保留，沿用关联事件；浏览器结果另验 |

## 事件与处理器

| 来源 | 事件 | 表达式 |
|---|---|---|
| src/components/AssistantPanel.vue:13 | tap | ask(prompt) |
| src/components/AssistantPanel.vue:16 | confirm | send |
| src/components/AssistantPanel.vue:16 | tap | send |
| src/components/CameraPreview.vue:10 | error | onNativeError |
| src/components/CameraPreview.vue:11 | initdone | onNativeReady |
| src/components/CameraPreview.vue:46 | tap | enableCamera |
| src/components/CompanionHub.vue:12 | tap | open('buddy') |
| src/components/CompanionHub.vue:13 | tap | open('team') |
| src/components/CompanionHub.vue:19 | tap | emit('remindTeam', member.id) |
| src/components/CompanionHub.vue:22 | tap | emit('createTeam') |
| src/components/CompanionHub.vue:23 | tap | emit('joinTeam', inviteCode) |
| src/components/CompanionHub.vue:24 | tap | emit('joinDemoTeam') |
| src/components/CompanionHub.vue:29 | tap | emit('setBuddyCycle', 7) |
| src/components/CompanionHub.vue:29 | tap | emit('setBuddyCycle', 30) |
| src/components/CompanionHub.vue:31 | tap | emit('remindBuddy') |
| src/components/CompanionHub.vue:33 | tap | emit('connectBuddy') |
| src/components/ExerciseCards.vue:8 | tap | emit('select', game.id) |
| src/components/KnowledgeHub.vue:4 | tap | emit('open', featured) |
| src/components/KnowledgeHub.vue:8 | tap | emit('open', item) |
| src/components/KnowledgeHub.vue:10 | tap | emit('open', item) |
| src/components/MagpieMotion.vue:16 | load | onRiveLoad |
| src/components/MagpieMotion.vue:17 | error | onRiveError |
| src/components/MagpieMotion.vue:33 | error | onVideoError |
| src/components/MagpieMotion.vue:59 | error | onVideoError |
| src/components/RehabGardenPanel.vue:7 | tap | selectSection('growth') |
| src/components/RehabGardenPanel.vue:14 | tap | selectSection('checkin') |
| src/components/RehabGardenPanel.vue:149 | tap | emit('shift-month', -1) |
| src/components/RehabGardenPanel.vue:153 | tap | emit('shift-month', 1) |
| src/components/TrainingExperience.vue:33 | timeupdate | onCourseTimeUpdate |
| src/components/TrainingExperience.vue:34 | ended | emit('course-ended') |
| src/components/TrainingExperience.vue:49 | status | emit('camera-status', $event) |
| src/components/TrainingExperience.vue:60 | tap | emit('rep') |
| src/components/TrainingExperience.vue:77 | tap | emit('beat') |
| src/components/TrainingReports.vue:9 | tap | selectTab('daily') |
| src/components/TrainingReports.vue:16 | tap | selectTab('monthly') |
| src/components/TrainingReports.vue:22 | tap | selectedDate = '' |
| src/components/TrainingReports.vue:30 | tap | selectedDate = report.date |
| src/components/TrainingReports.vue:41 | tap | selectedMonth = '' |
| src/components/TrainingReports.vue:47 | tap | selectedMonth = report.month |
| src/components/VitalForm.vue:7 | input | setValue('sbp', $event) |
| src/components/VitalForm.vue:11 | input | setValue('dbp', $event) |
| src/components/VitalForm.vue:15 | input | setValue('hr', $event) |
| src/components/VitalForm.vue:19 | input | setValue('spo2', $event) |
| src/components/VitalForm.vue:23 | change | setBorg |
| src/pages/index/index.vue:23 | tap | chooseMode('public') |
| src/pages/index/index.vue:36 | tap | chooseMode('cardiac') |
| src/pages/index/index.vue:47 | tap | showAiBoundary = true |
| src/pages/index/index.vue:52 | tap | backToMode |
| src/pages/index/index.vue:97 | tap | bindPatient |
| src/pages/index/index.vue:110 | tap | activeNav = 'profile' |
| src/pages/index/index.vue:165 | tap | goDetail('devices') |
| src/pages/index/index.vue:231 | change | onPrescriptionSlide |
| src/pages/index/index.vue:290 | tap | startPrescriptionTask(task) |
| src/pages/index/index.vue:306 | tap | openGarden('growth') |
| src/pages/index/index.vue:349 | tap | toggleCategory(category.id) |
| src/pages/index/index.vue:368 | tap | chooseSelfDirected(game.id) |
| src/pages/index/index.vue:399 | tap | startSelfSelected |
| src/pages/index/index.vue:407 | tap | openGarden('growth') |
| src/pages/index/index.vue:441 | open-social | openSocial |
| src/pages/index/index.vue:446 | open | openKnowledgeItem |
| src/pages/index/index.vue:461 | start-plan | selectExercise(featuredGame.id) |
| src/pages/index/index.vue:462 | open-reports | openLatestReport |
| src/pages/index/index.vue:463 | open-devices | goDetail('devices') |
| src/pages/index/index.vue:464 | open-profile | goDetail('health-archive') |
| src/pages/index/index.vue:489 | tap | openLatestReport |
| src/pages/index/index.vue:503 | tap | goDetail('devices') |
| src/pages/index/index.vue:518 | tap | goDetail('devices') |
| src/pages/index/index.vue:523 | tap | goDetail('devices') |
| src/pages/index/index.vue:610 | tap | goDetail('health-archive') |
| src/pages/index/index.vue:618 | tap | openGarden('growth') |
| src/pages/index/index.vue:642 | tap | openGarden('checkin') |
| src/pages/index/index.vue:651 | tap | goDetail('devices') |
| src/pages/index/index.vue:660 | tap | goDetail('health-archive') |
| src/pages/index/index.vue:666 | tap | openTrainingReports |
| src/pages/index/index.vue:689 | tap | goDetail('prototype-policy') |
| src/pages/index/index.vue:697 | tap | goDetail('doctor-reviews') |
| src/pages/index/index.vue:709 | tap | switchMode |
| src/pages/index/index.vue:710 | tap | showAiBoundary = true |
| src/pages/index/index.vue:711 | tap | resetPrototype |
| src/pages/index/index.vue:720 | tap | switchNav(item.id) |
| src/pages/index/index.vue:735 | tap | closeDetail |
| src/pages/index/index.vue:736 | tap | showAiBoundary = true |
| src/pages/index/index.vue:749 | tap | day.today && selectExercise(day.gameId) |
| src/pages/index/index.vue:782 | tap | selectExercise(categoryRecommendedGame.id) |
| src/pages/index/index.vue:790 | tap | selectExercise(game.id) |
| src/pages/index/index.vue:832 | changing | setPreDiscomfortScore |
| src/pages/index/index.vue:833 | change | setPreDiscomfortScore |
| src/pages/index/index.vue:845 | tap | reportPrecheckDiscomfort |
| src/pages/index/index.vue:865 | tap | readPreVitalsFromDevice |
| src/pages/index/index.vue:872 | tap | chooseManualPreVitals |
| src/pages/index/index.vue:889 | input |  setManualPreVital('systolicBloodPressure', $event)  |
| src/pages/index/index.vue:904 | input |  setManualPreVital('diastolicBloodPressure', $event)  |
| src/pages/index/index.vue:919 | input | setManualPreVital('oxygenSaturation', $event) |
| src/pages/index/index.vue:946 | tap | startTraining |
| src/pages/index/index.vue:952 | tap | skipPre |
| src/pages/index/index.vue:984 | camera-status | cameraStatus = $event |
| src/pages/index/index.vue:985 | course-time | syncCourseElapsed |
| src/pages/index/index.vue:986 | course-ended | finishTraining(false) |
| src/pages/index/index.vue:987 | rep | recordRep |
| src/pages/index/index.vue:988 | beat | recordBeat |
| src/pages/index/index.vue:990 | tap | toggleTraining |
| src/pages/index/index.vue:992 | tap | showStopReason = true |
| src/pages/index/index.vue:998 | tap | finishTraining(true) |
| src/pages/index/index.vue:1001 | tap | finishTraining(false) |
| src/pages/index/index.vue:1019 | tap | simulateVitalSync('post') |
| src/pages/index/index.vue:1058 | tap | useManualSnapshot('post') |
| src/pages/index/index.vue:1068 | change | setSnapshotBorg('post', $event) |
| src/pages/index/index.vue:1076 | tap | setPostFeeling(feeling) |
| src/pages/index/index.vue:1084 | tap | generateReport |
| src/pages/index/index.vue:1090 | tap | skipPost |
| src/pages/index/index.vue:1213 | tap | closeDetail |
| src/pages/index/index.vue:1224 | update:section | setGardenSection |
| src/pages/index/index.vue:1225 | shift-month | shiftCalendarMonth |
| src/pages/index/index.vue:1252 | create-team | createDemoTeam |
| src/pages/index/index.vue:1253 | join-team | joinTeamByCode |
| src/pages/index/index.vue:1254 | join-demo-team | applyDemoTeam |
| src/pages/index/index.vue:1255 | remind-team | remindTeamMember |
| src/pages/index/index.vue:1256 | set-buddy-cycle | setBuddyCycle |
| src/pages/index/index.vue:1257 | connect-buddy | applyDemoBuddy |
| src/pages/index/index.vue:1258 | remind-buddy | remindBuddy |
| src/pages/index/index.vue:1270 | tap | simulateDeviceConnect(source.id) |
| src/pages/index/index.vue:1312 | tap | saveManualSteps |
| src/pages/index/index.vue:1370 | change | setPublicBirthDate |
| src/pages/index/index.vue:1396 | tap | publicProfileDraft.gender = item.value |
| src/pages/index/index.vue:1408 | tap | savePublicProfile |
| src/pages/index/index.vue:1453 | tap |  activeNav = 'today'; closeDetail();  |
| src/pages/index/index.vue:1472 | tap | goDetail('devices') |
| src/pages/index/index.vue:1481 | tap | setHealthGoal('habit') |
| src/pages/index/index.vue:1486 | tap | setHealthGoal('weight') |
| src/pages/index/index.vue:1492 | tap | setHealthGoal('cardiac') |
| src/pages/index/index.vue:1530 | tap | convertPoints |
| src/pages/index/index.vue:1544 | tap | confirmRedeem(reward) |
| src/pages/index/index.vue:1578 | tap | publishPolicy |
| src/pages/index/index.vue:1586 | tap | setPolicyMode('pre', item.id) |
| src/pages/index/index.vue:1598 | tap | setPolicyMode('post', item.id) |
| src/pages/index/index.vue:1612 | change | setPolicyField(field.id, $event) |
| src/pages/index/index.vue:1622 | tap | seedScenario('stable') |
| src/pages/index/index.vue:1623 | tap | seedScenario('attention') |
| src/pages/index/index.vue:1624 | tap | seedScenario('stop') |
| src/pages/index/index.vue:1625 | tap | seedScenario('insufficient') |
| src/pages/index/index.vue:1654 | tap | resolveReview(review.id, 'approved') |
| src/pages/index/index.vue:1656 | tap | resolveReview(review.id, 'maintained') |
| src/pages/index/index.vue:1658 | tap | resolveReview(review.id, 'rejected') |
| src/pages/index/index.vue:1716 | tap | showAiBoundary = false |
| src/pages/index/index.vue:1721 | tap | showAiBoundary = false |
| src/pages/index/index.vue:1730 | tap | stopTraining(item.label) |
| src/pages/index/index.vue:1733 | tap | showStopReason = false |

## 双向表单字段

| 来源 | 数据绑定 |
|---|---|
| src/components/AssistantPanel.vue:16 | query |
| src/components/CompanionHub.vue:23 | inviteCode |
| src/pages/index/index.vue:71 | visitNumber |
| src/pages/index/index.vue:1042 | postSnapshot.heartRate |
| src/pages/index/index.vue:1050 | postSnapshot.oxygenSaturation |
| src/pages/index/index.vue:1302 | manualStepsInput |
| src/pages/index/index.vue:1354 | publicProfileDraft.name |

## 资源回退

- Rive 资源开关、MP4、poster、sprite、overlay、WASM、微信原生组件沿用原契约。未导出的正式 .riv 继续 disabled 并播放 MP4。
- 所有原始资产路径和大小见 JSON，新增资源单独落盘。
- 图像风格：用户已确认全绿界面、紫色小喜、独立树体；28 张图为视觉依据。
- 本盘点不代表实现或浏览器验收通过。
