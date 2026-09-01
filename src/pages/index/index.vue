<template>
  <view class="prototype-shell" :data-user-mode="mode">
    <view v-if="!appReady" class="onboarding">
      <view class="brand-row"><view class="brand-mark"><image :src="magpieAsset" mode="aspectFit" /></view><view><text class="brand-name">小喜鹊运动伙伴</text><text class="brand-caption">每天动一点，身体更轻松</text></view></view>
      <view v-if="onboardingStep === 'mode'" class="onboarding-card" data-testid="onboarding-mode">
        <image class="welcome-magpie" :src="magpieAsset" mode="aspectFit" />
        <text class="panel-kicker">选择使用方式</text><text class="panel-title">今天想从哪里开始？</text><text class="panel-copy">三类3分钟轻运动都可以使用，心脏康复用户可额外关联医院计划。</text>
        <button class="mode-card mode-card--public" data-testid="choose-public" @tap="chooseMode('public')"><view class="mode-icon"><AppIcon src="/static/icons/magpie-line/exercise.svg" :size="46" /></view><view class="mode-content"><text class="mode-title">日常运动用户</text><text class="mode-copy">无需注册，直接开始八段锦、抗阻或音乐律动</text><text class="mode-note">资料以后可在“我的”补充</text></view><text class="mode-arrow">›</text></button>
        <button class="mode-card" data-testid="choose-cardiac" @tap="chooseMode('cardiac')"><view class="mode-icon"><AppIcon src="/static/icons/magpie-line/heart-rate.svg" :size="46" /></view><view class="mode-content"><text class="mode-title">心脏康复用户</text><text class="mode-copy">选择医院并关联患者号，查看康复计划与记录</text><text class="mode-note">演示支持北京市丰台康复医院</text></view><text class="mode-arrow">›</text></button>
        <button class="text-button" @tap="showAiBoundary = true">查看健康助手与医疗边界</button>
      </view>
      <view v-else class="onboarding-card" data-testid="onboarding-binding">
        <button class="back-link" @tap="backToMode">‹ 返回选择</button>
        <text class="panel-kicker">关联康复计划</text><text class="panel-title">选择医院并输入患者号</text><text class="panel-copy">本地演示数据不会连接真实医院系统，患者号不作为正式身份认证。</text>
        <view class="field-block"><text class="field-label">医院</text><view class="hospital-select"><AppIcon src="/static/icons/magpie-line/archive.svg" :size="34" /><text>{{ sharedPatientFixture.hospital.name }}</text><text>✓</text></view></view>
        <view class="field-block"><text class="field-label">患者号</text><input v-model="visitNumber" class="text-input" data-testid="visit-number" placeholder="输入 256572 或 P-256572" maxlength="16" /></view>
        <view v-if="bindingState === 'matched'" class="match-card"><view class="match-icon">✓</view><view><text class="match-title">已匹配到康复计划</text><text class="match-copy">{{ sharedPatientFixture.patient.maskedName }} · {{ sharedPatientFixture.patient.rehabStage }} · {{ sharedPatientFixture.patient.riskLevel }}</text><text class="match-copy">处方 {{ sharedPatientFixture.prescription.prescriptionNo }} · {{ sharedPatientFixture.prescription.version }}</text></view></view>
        <view v-if="bindingState === 'error'" class="form-error">未找到康复计划，请检查患者号后重试。</view>
        <button class="primary-button" :loading="bindingState === 'loading'" data-testid="bind-plan" @tap="bindPatient">{{ bindingState === 'matched' ? '确认并进入患者首页' : '查询康复计划' }}</button>
        <button class="text-button" @tap="chooseMode('public')">改用日常运动模式</button>
      </view>
    </view>

    <template v-else>
      <view v-if="detailView === 'none'" class="app-frame">
        <view class="topbar"><view class="topbar-brand"><view class="topbar-logo"><image :src="magpieAsset" mode="aspectFit" /></view><view><text class="topbar-title">{{ greeting }}，{{ displayName }}</text><text class="topbar-kicker">{{ todayLabel }}</text></view></view><view class="topbar-actions"><button class="topbar-notice" aria-label="打开小喜助手" @tap="activeNav = 'assistant'"><text class="notice-dot" /><AppIcon src="/static/icons/magpie-line/chat.svg" :size="34" /></button><button class="avatar-button" @tap="activeNav = 'profile'">{{ displayName.slice(0, 1) }}</button></view></view>
        <scroll-view class="page-scroll" scroll-y :scroll-top="activeNav === 'knowledge' ? knowledgeScrollTop : 0" @scroll="rememberPageScroll">
          <view v-if="activeNav === 'home'" class="screen" data-testid="home-screen">
            <view class="today-status-card">
              <view class="today-status-card__head">
                <view><text class="panel-kicker">今日运动状态</text><text class="status-title">{{ taskCompleted ? '今天已完成，继续保持' : '状态平稳，可以开始' }}</text></view>
                <view class="status-chip"><text class="status-chip__dot" />{{ mode === 'cardiac' ? '安全状态良好' : '今日可运动' }}</view>
              </view>
              <view class="status-dashboard">
                <view class="progress-ring" :class="{ complete: completedExerciseCount >= 3 }"><text class="progress-value">{{ completedExerciseCount }}/3</text><text class="progress-label">今日项目</text></view>
                <view class="status-stats"><view><text class="status-number">{{ completedMinutes }}</text><text class="status-unit">分钟</text><text class="status-caption">累计运动</text></view><view><text class="status-number">{{ currentMetrics[0].value }}</text><text class="status-unit">{{ currentMetrics[0].unit }}</text><text class="status-caption">{{ currentMetrics[0].label }}</text></view></view>
              </view>
              <button class="status-device" @tap="goDetail('devices')"><AppIcon src="/static/icons/magpie-line/device.svg" :size="30" /><text>{{ deviceConnected ? '模拟设备已连接，数据已同步' : '连接手环，自动同步运动数据' }}</text><text class="status-device__action">{{ deviceConnected ? '已连接' : '去连接' }} ›</text></button>
            </view>

            <view class="section-heading home-section-heading"><view><text class="section-title">{{ mode === 'cardiac' ? '今日康复任务' : '今日推荐运动' }}</text><text class="section-subtitle">{{ mode === 'cardiac' ? '依据你的医院计划优先推荐' : '先从轻松的3分钟开始' }}</text></view><text class="section-link" @tap="openKnowledge('guide')">训练指南 ›</text></view>
            <view class="today-training-card">
              <view class="today-training-card__visual"><MagpieMotion :label="featuredActivity.title" :video-src="featuredActivity.video" :poster="featuredActivity.poster" :riv-src="featuredActivity.rive.enabled ? featuredActivity.rive.src : ''" :artboard="featuredActivity.rive.artboard" :state-machine="featuredActivity.rive.stateMachine" :fit="featuredActivity.rive.fit" /></view>
              <view class="today-training-card__body"><view class="tag-row"><text class="tag tag--green">{{ mode === 'cardiac' ? '今日计划' : '今日推荐' }}</text><text class="tag">3分钟体验</text></view><text class="training-title">{{ featuredGame.title }}</text><text class="training-meta">{{ featuredGame.subtitle }}</text><view class="training-benefits"><text v-for="benefit in featuredBenefits" :key="benefit">{{ benefit }}</text></view><button class="training-start" @tap="selectExercise(featuredGame.id)">开始训练</button></view>
            </view>

            <view class="section-heading home-section-heading"><view><text class="section-title">三类运动</text><text class="section-subtitle">选一种喜欢的方式，立即进入训练</text></view></view>
            <view class="game-grid"><button v-for="game in exerciseGames" :key="game.id" class="game-card" :data-exercise="game.id" @tap="selectExercise(game.id)"><view class="game-card__icon"><AppIcon :src="game.iconPath" :size="42" color="#16A085" /></view><text class="game-card__title">{{ game.title }}</text><text class="game-card__subtitle">{{ game.feature }}</text><text class="game-card__duration">{{ game.duration }} ›</text></button></view>

            <view class="section-heading home-section-heading"><view><text class="section-title">健康指标</text><text class="section-subtitle">数据来源均为原型模拟</text></view><text class="section-link" @tap="goDetail('health-archive')">健康档案 ›</text></view>
            <view class="health-summary"><view class="metric-grid"><view v-for="metric in currentMetrics" :key="metric.id" class="metric-item"><view class="metric-heading"><text class="metric-label">{{ metric.label }}</text><text class="metric-dot" :class="'tone-' + metric.tone" /></view><view><text class="metric-value">{{ metric.value }}</text><text class="metric-unit">{{ metric.unit }}</text></view><text class="metric-status">{{ metric.status }}</text></view></view></view>
            <button class="assistant-entry" @tap="activeNav = 'assistant'"><view class="assistant-entry__avatar"><image :src="magpieAsset" mode="aspectFit" /></view><view><text>有问题就问小喜</text><text class="small-text">训练、报告、安全提示与设备说明</text></view><text>›</text></button>
          </view>

          <KnowledgeHub v-else-if="activeNav === 'knowledge'" v-model:category="knowledgeCategory" v-model:query="knowledgeQuery" :mode="mode" :items="knowledgeItems" @open="openKnowledgeItem" />

          <AssistantPanel v-else-if="activeNav === 'assistant'" class="screen" :mode="mode" :display-name="displayName" :mascot="magpieAsset" />

          <view v-else-if="activeNav === 'reports'" class="screen" data-testid="reports-screen">
            <view class="page-heading"><text class="screen-kicker">训练报告</text><text class="screen-title">每一次进步都有记录</text><text class="screen-copy">大众报告关注训练表现；患者报告额外展示计划属性和运动前后记录。</text></view>
            <view class="report-overview"><view><text class="summary-kicker">本周完成</text><text class="report-big">{{ completedSessionCount }}</text><text class="summary-copy">次训练 · 连续 {{ streak }} 天</text></view><view class="report-ring">{{ Math.min(100, completedExerciseCount * 33) }}%</view></view>
            <view class="section-heading"><view><text class="section-title">最近记录</text><text class="section-subtitle">点击查看最近生成的详细报告</text></view></view>
            <button v-if="latestSession" class="record-card" data-testid="latest-report" @tap="goDetail('session-report')"><view class="record-date"><text class="strong-text">今</text><text>本机</text></view><view class="record-body"><text class="record-title">{{ latestSession.title }}</text><text class="record-copy">{{ formatDuration(latestSession.durationSeconds) }} · {{ latestSession.results[0]?.label }} {{ latestSession.results[0]?.value }}</text><view class="record-status">{{ latestSession.planType === 'prescription' ? '计划内训练' : '自主训练' }}</view></view><text>›</text></button><view v-else class="empty-card">还没有训练报告，从首页选择一种运动开始吧。</view>
            <button v-if="mode === 'cardiac'" class="record-card" @tap="goDetail('hospital-report')"><view class="record-date record-date--hospital"><text class="strong-text">院</text><text>模拟</text></view><view class="record-body"><text class="record-title">医院运动记录</text><text class="record-copy">{{ sharedPatientFixture.recentHospitalSession.project }} · {{ sharedPatientFixture.recentHospitalSession.date }}</text><view class="record-status">来源：共享演示数据</view></view><text>›</text></button>
          </view>

          <view v-else-if="activeNav === 'growth'" class="screen" data-testid="growth-screen">
            <view class="growth-hero"><text class="screen-kicker">坚持会被看见</text><text class="growth-number">{{ points }}</text><text class="growth-label">可用积分</text><view class="growth-stats"><view><text class="strong-text">{{ streak }}</text><text>连续天数</text></view><view><text class="strong-text">{{ completedExerciseCount }}</text><text>今日完成</text></view><view><text class="strong-text">3</text><text>虚拟徽章</text></view></view></view>
            <view class="calendar-card"><text class="section-title">本月打卡</text><view class="calendar-week"><text v-for="day in ['一','二','三','四','五','六','日']" :key="day">{{ day }}</text></view><view class="calendar-grid"><view v-for="item in calendarDays" :key="item.day" class="calendar-day" :class="{ done: item.done, today: item.today }"><text>{{ item.day }}</text></view></view></view>
            <button class="store-banner" @tap="goDetail('reward-store')"><view><text class="store-title">积分与徽章</text><text class="store-copy">患者活动奖励与大众虚拟权益分开展示</text></view><text>›</text></button>
          </view>

          <view v-else class="screen profile-screen" data-testid="profile-screen">
            <view class="profile-page-heading"><text>我的</text><button @tap="showAiBoundary = true">设置</button></view>
            <view class="profile-card"><view class="profile-avatar">{{ displayName.slice(0, 1) }}</view><view class="profile-identity"><text class="profile-name">{{ mode === 'cardiac' ? sharedPatientFixture.patient.name : '运动伙伴' }}</text><text class="profile-copy">{{ mode === 'cardiac' ? sharedPatientFixture.hospital.name + ' · ' + sharedPatientFixture.patient.patientNo : '日常运动用户 · 点击完善资料' }}</text><text class="profile-id">UUID·XQ-2026-0901</text></view><button class="profile-edit" @tap="goDetail('health-archive')">编辑 ›</button></view>

            <view class="profile-overview">
              <button @tap="activeNav = 'growth'"><text class="profile-overview__value">{{ points }}</text><text>我的积分</text></button>
              <button @tap="activeNav = 'growth'"><text class="profile-overview__value">{{ streak }}</text><text>连续天数</text></button>
              <button @tap="activeNav = 'reports'"><text class="profile-overview__value">{{ completedSessionCount }}</text><text>运动报告</text></button>
            </view>

            <view class="profile-section-heading"><text>坚持运动</text><text>和伙伴一起更容易坚持</text></view>
            <view class="habit-actions">
              <button class="habit-card habit-card--checkin" :class="{ done: checkInDone }" data-testid="daily-checkin" @tap="handleDailyCheckIn">
                <view class="habit-card__icon"><AppIcon src="/static/icons/magpie-line/badge.svg" :size="42" /></view>
                <view><text class="habit-card__title">{{ checkInDone ? '今日已打卡' : '今日打卡' }}</text><text class="habit-card__copy">{{ checkInDone ? '连续 ' + streak + ' 天，明天见' : '记录今天的坚持' }}</text></view>
                <text class="habit-card__action">{{ checkInDone ? '已完成' : '+5积分' }}</text>
              </button>
              <button class="habit-card" data-testid="team-entry" @tap="goDetail('team')">
                <view class="habit-card__icon"><AppIcon src="/static/icons/magpie-line/profile.svg" :size="42" /></view>
                <view><text class="habit-card__title">健康组队</text><text class="habit-card__copy">{{ teamJoined ? '已加入·小喜鹊7天轻运动队' : '邀请亲友相互提醒' }}</text></view>
                <text class="habit-card__action">{{ teamJoined ? '查看队伍' : '去组队' }} ›</text>
              </button>
            </view>

            <view class="profile-section-heading"><text>健康管理</text><text>我的记录与设备</text></view>
            <view class="profile-service-grid"><button @tap="goDetail('health-archive')"><AppIcon src="/static/icons/magpie-line/archive.svg" /><text>健康档案</text></button><button @tap="activeNav = 'reports'"><AppIcon src="/static/icons/magpie-line/report.svg" /><text>运动报告</text></button><button @tap="goDetail('devices')"><AppIcon src="/static/icons/magpie-line/device.svg" /><text>设备管理</text></button><button @tap="goDetail('assessment')"><AppIcon src="/static/icons/magpie-line/assessment.svg" /><text>体适能评估</text></button></view>
            <view class="profile-section-heading"><text>常用服务</text></view>
            <view class="menu-group"><button class="menu-row" @tap="switchMode"><view class="menu-row__icon"><AppIcon src="/static/icons/magpie-line/sync.svg" :size="34" /></view><view><text>切换使用模式</text><text class="small-text">日常运动 / 心脏康复</text></view><text>›</text></button><button class="menu-row" @tap="showAiBoundary = true"><view class="menu-row__icon"><AppIcon src="/static/icons/magpie-line/assistant.svg" :size="34" /></view><view><text>小喜助手设置</text><text class="small-text">查看能力边界与隐私说明</text></view><text>›</text></button><button class="menu-row" @tap="resetPrototype"><view class="menu-row__icon"><AppIcon src="/static/icons/magpie-line/record.svg" :size="34" /></view><view><text>重置原型数据</text><text class="small-text">清除本机演示记录</text></view><text>›</text></button></view>
            <text class="prototype-note">所有人物、指标、评分、积分与奖励均为原型模拟，不连接真实医疗或设备系统。</text>
          </view>
        </scroll-view>
        <view class="bottom-nav"><button v-for="item in navItems" :key="item.id" class="nav-button" :class="{ active: activeNav === item.id, 'nav-button--assistant': item.id === 'assistant' }" @tap="activeNav = item.id"><view class="nav-icon"><image v-if="item.mascotPath" class="nav-mascot" :class="{ 'nav-mascot--active': activeNav === item.id }" :src="item.mascotPath" mode="aspectFit" /><AppIcon v-else :src="item.iconPath" :size="40" :active="activeNav === item.id" :color="activeNav === item.id ? '#16A085' : '#64748B'" /></view><text>{{ item.label }}</text></button></view>
      </view>

      <view v-else class="detail-frame" :data-detail-view="detailView">
        <view class="detail-header"><button class="detail-back" @tap="closeDetail">‹</button><text>{{ detailTitle }}</text><button class="detail-help" @tap="showAiBoundary = true">?</button></view>
        <scroll-view class="detail-scroll" scroll-y>
          <view v-if="detailView === 'precheck'" class="detail-content" data-testid="precheck-screen">
            <StepIndicator :current="1" />
            <view class="selected-plan-card"><image :src="selectedGame.poster" mode="aspectFill" /><view><text class="summary-kicker">{{ isCurrentPrescription ? '今日计划' : '自主训练' }}</text><text class="summary-title">{{ selectedGame.title }} · 3分钟</text><text class="summary-copy">{{ selectedGame.subtitle }}</text></view></view>
            <view class="safety-card"><AppIcon src="/static/icons/magpie-line/safety.svg" color="#16A085" /><view><text class="card-title">先确认今天适合运动</text><text class="card-copy">患者模式需如实记录；异常症状只触发暂停建议，不进行诊断。</text></view></view>
            <view class="form-card"><text class="form-title">现在是否有以下不适？</text><checkbox-group class="symptom-list" @change="updateSymptoms"><label v-for="item in symptomOptions" :key="item.value" class="symptom-item"><checkbox :value="item.value" color="#16A085" /><text>{{ item.label }}</text></label></checkbox-group><view v-if="preSymptoms.length" class="warning-box">本次建议暂停运动。症状持续或明显时请及时联系医生；严重不适请呼叫急救。</view></view>
            <VitalForm title="运动前记录" :vitals="preVitals" />
            <button class="primary-button" :disabled="preSymptoms.length > 0" data-testid="begin-training" @tap="startTraining">确认状态良好，开始{{ selectedGame.title }}</button>
          </view>

          <view v-else-if="detailView === 'training'" class="detail-content detail-content--training" data-testid="training-screen">
            <view class="training-header-strip"><view><text class="tag tag--green">{{ trainingStatus === 'paused' ? '已暂停' : '跟练中' }}</text><text class="training-title">{{ selectedGame.title }}</text></view><view class="timer"><text>{{ formattedElapsed }}</text><text>/ 03:00</text></view></view>
            <TrainingExperience :game="selectedGame" :activity="todayActivity" :score="activityScore" :paused="trainingStatus === 'paused'" :rep-count="repCount" :rhythm-hits="rhythmHits" :rhythm-combo="rhythmCombo" :rhythm-round="rhythmRound" @camera-status="cameraStatus = $event" @rep="recordRep" @beat="recordBeat" />
            <view class="exercise-controls"><button class="secondary-button" @tap="toggleTraining">{{ trainingStatus === 'paused' ? '继续训练' : '暂停' }}</button><button class="secondary-button danger-button" @tap="showStopReason = true">我有不适</button></view>
            <button class="primary-button" data-testid="demo-complete" @tap="finishTraining(true)">快速完成演示</button><button class="text-button" data-testid="finish-training" @tap="finishTraining(false)">结束本次训练</button>
          </view>

          <view v-else-if="detailView === 'postcheck'" class="detail-content" data-testid="postcheck-screen">
            <StepIndicator :current="3" />
            <view class="completion-card" :class="{ 'completion-card--stopped': trainingStatus === 'stopped' }"><text class="completion-icon">{{ trainingStatus === 'stopped' ? '停' : '✓' }}</text><view><text class="card-title">{{ trainingStatus === 'stopped' ? '本次训练已安全停止' : '训练完成，先慢慢放松' }}</text><text class="card-copy">{{ trainingStatus === 'stopped' ? '停止记录会保留，但不计计划完成和积分。' : '休息后记录身体感受，再生成报告。' }}</text></view></view>
            <VitalForm v-if="mode === 'cardiac'" title="运动后记录" :vitals="postVitals" />
            <view class="form-card"><text class="form-title">运动后感受</text><view class="feeling-row"><button v-for="feeling in ['轻松','适中','有点累']" :key="feeling" :class="{ active: postFeeling === feeling }" @tap="postFeeling = feeling">{{ feeling }}</button></view></view>
            <button class="primary-button" data-testid="generate-report" @tap="generateReport">生成本次运动报告</button>
          </view>

          <view v-else-if="detailView === 'session-report'" class="detail-content" data-testid="session-report-screen">
            <view v-if="latestSession" class="session-result" :class="{ 'session-result--stopped': latestSession.status === 'stopped' }"><view class="result-medal">{{ latestSession.status === 'stopped' ? '停' : latestSession.score }}</view><text class="result-title">{{ latestSession.status === 'stopped' ? '本次训练已停止并记录' : latestSession.title + '完成' }}</text><text class="result-copy">{{ latestSession.demoCompleted ? '本次通过原型演示模式快速完成。' : '本次按实际操作时长生成报告。' }}</text><view class="result-tags"><text>{{ formatDuration(latestSession.durationSeconds) }}</text><text>{{ latestSession.planType === 'prescription' ? '计划内训练' : '自主训练' }}</text><text>{{ latestSession.pointsAwarded ? '+' + latestSession.pointsAwarded + '积分' : '未新增积分' }}</text></view></view>
            <view v-if="latestSession" class="report-section"><text class="form-title">专项表现</text><view class="result-grid"><view v-for="item in latestSession.results" :key="item.label"><text>{{ item.label }}</text><text class="strong-text">{{ item.value }}</text></view></view></view>
            <view v-if="mode === 'cardiac'" class="report-section"><text class="form-title">运动前 / 后对比</text><view class="compare-table"><view class="compare-row compare-head"><text>指标</text><text>运动前</text><text>运动后</text></view><view class="compare-row"><text>血压</text><text>{{ preVitals.sbp }}/{{ preVitals.dbp }}</text><text>{{ postVitals.sbp }}/{{ postVitals.dbp }}</text></view><view class="compare-row"><text>心率</text><text>{{ preVitals.hr }}</text><text>{{ postVitals.hr }}</text></view><view class="compare-row"><text>血氧</text><text>{{ preVitals.spo2 }}%</text><text>{{ postVitals.spo2 }}%</text></view><view class="compare-row"><text>Borg</text><text>{{ preVitals.borg }}</text><text>{{ postVitals.borg }}</text></view></view><text class="source-note">处方来源：{{ sharedPatientFixture.hospital.name }} · {{ sharedPatientFixture.prescription.prescriptionNo }} {{ sharedPatientFixture.prescription.version }}</text></view>
            <view class="report-section"><text class="form-title">小喜总结</text><view class="ai-summary"><image :src="magpieAsset" mode="aspectFit" /><text>{{ latestSession?.status === 'stopped' ? '你及时停止了训练。请继续观察身体状态，症状持续或加重时及时寻求专业帮助。' : '完成得很好。建议补充水分并充分休息。本总结只用于健康教育，不代替医生判断。' }}</text></view></view><button class="primary-button" @tap="closeDetail">返回首页</button>
          </view>

          <view v-else-if="detailView === 'hospital-report'" class="detail-content"><DetailIntro kicker="共享演示数据" title="医院运动记录" copy="当前记录来自Web V2.2共享患者数据，不连接真实医院接口。" /><view class="hospital-session"><text class="summary-title">{{ sharedPatientFixture.recentHospitalSession.project }}</text><text class="summary-copy">{{ sharedPatientFixture.recentHospitalSession.date }} · Borg {{ sharedPatientFixture.recentHospitalSession.borg }}</text><view class="hospital-values"><text>前 {{ sharedPatientFixture.recentHospitalSession.before }}</text><text>中 {{ sharedPatientFixture.recentHospitalSession.during }}</text><text>后 {{ sharedPatientFixture.recentHospitalSession.after }}</text></view></view></view>
          <view v-else-if="detailView === 'health-archive'" class="detail-content"><DetailIntro kicker="个人健康资料" title="健康档案" copy="明确区分医院共享、模拟设备与用户补充数据。" /><view class="archive-card"><text class="form-title">基础信息</text><view class="archive-grid"><view><text>姓名</text><text class="strong-text">{{ mode === 'cardiac' ? sharedPatientFixture.patient.name : '待补充' }}</text></view><view><text>年龄</text><text class="strong-text">{{ mode === 'cardiac' ? sharedPatientFixture.patient.age + ' 岁' : '待补充' }}</text></view><view><text>用户类型</text><text class="strong-text">{{ mode === 'cardiac' ? sharedPatientFixture.patient.rehabStage : '日常运动' }}</text></view><view><text>风险等级</text><text class="strong-text">{{ mode === 'cardiac' ? sharedPatientFixture.patient.riskLevel : '不适用' }}</text></view></view></view><view v-if="mode === 'cardiac'" class="archive-card"><text class="form-title">康复摘要</text><view class="summary-list"><text>诊断：{{ sharedPatientFixture.patient.diagnosis }}</text><text>主管医生：{{ sharedPatientFixture.patient.assignedDoctor }}</text><text>处方：{{ sharedPatientFixture.prescription.prescriptionNo }} {{ sharedPatientFixture.prescription.version }}</text><text>数据来源：Web V2.2共享演示文件</text></view></view></view>
          <view v-else-if="detailView === 'devices'" class="detail-content"><DetailIntro kicker="数据来源管理" title="连接设备" copy="当前只展示接入路径，不读取真实健康设备。" /><view class="device-card"><AppIcon src="/static/icons/magpie-line/device.svg" /><view><text class="record-title">智能手环 / 手表</text><text class="record-copy">心率、血氧、步数与活动时长</text></view><button @tap="simulateSync">{{ deviceConnected ? '已模拟连接' : '模拟连接' }}</button></view><view class="privacy-note">正式授权前需说明数据类型、用途、保存期限与撤回方式。</view></view>
          <view v-else-if="detailView === 'knowledge-article'" class="detail-content" data-testid="knowledge-article"><image class="knowledge-detail-cover" :src="selectedKnowledgeItem.poster" mode="aspectFill" /><view class="knowledge-detail-heading"><view class="tag-row"><text class="tag tag--green">{{ selectedKnowledgeItem.type === 'guide' ? '指南' : '康复小贴士' }}</text><text class="tag">原型内容 · 待医学审核</text></view><text class="knowledge-detail-title">{{ selectedKnowledgeItem.title }}</text><text class="knowledge-detail-summary">{{ selectedKnowledgeItem.summary }}</text><view class="knowledge-detail-meta"><text>{{ selectedKnowledgeItem.duration }}</text><text v-for="tag in selectedKnowledgeItem.tags" :key="tag"># {{ tag }}</text></view></view><view class="knowledge-article-body"><text v-for="(paragraph, index) in selectedKnowledgeItem.body" :key="index">{{ paragraph }}</text></view><view class="knowledge-review-note"><text>内容说明</text><text>当前内容仅用于产品原型与健康教育流程演示，未经过医学专家正式审核，不可替代医生诊断、治疗或个体化康复处方。</text></view><button class="primary-button" @tap="closeDetail">返回知识库</button></view>
          <view v-else-if="detailView === 'knowledge-video'" class="detail-content" data-testid="knowledge-video"><view class="knowledge-video-shell"><video :src="selectedKnowledgeItem.video" :poster="selectedKnowledgeItem.poster" :controls="true" :show-center-play-btn="true" :show-fullscreen-btn="true" object-fit="contain" /></view><view class="knowledge-detail-heading"><view class="tag-row"><text class="tag tag--green">健康短视频</text><text class="tag">{{ selectedKnowledgeItem.duration }}</text></view><text class="knowledge-detail-title">{{ selectedKnowledgeItem.title }}</text><text class="knowledge-detail-summary">{{ selectedKnowledgeItem.summary }}</text><view class="knowledge-detail-meta"><text v-for="tag in selectedKnowledgeItem.tags" :key="tag"># {{ tag }}</text></view></view><view class="knowledge-demo-badge"><image :src="magpieAsset" mode="aspectFit" /><view><text>原型演示素材</text><text>此视频为本地生成的界面演示素材，正式科普内容与动作需经医学专家审核后替换。</text></view></view><view class="knowledge-review-note"><text>医疗边界</text><text>短视频不提供诊断、用药调整或个体化处方。运动中出现胸痛、明显气促、头晕或意识异常时，请立即停止并寻求医疗帮助。</text></view><button class="primary-button" @tap="closeDetail">返回短视频</button></view>
          <view v-else-if="detailView === 'assessment'" class="detail-content"><DetailIntro kicker="体适能记录" title="五项基础评估" copy="以下为原型演示结果，只用于展示页面结构，不代表真实医学判断。" /><view class="assessment-score"><text class="small-text">综合状态</text><text class="result-title">基础活动能力良好</text><text class="result-copy">建议保持规律轻运动，并根据身体感受逐步增加训练。</text></view><view class="assessment-list"><view v-for="item in assessmentItems" :key="item.name"><view><text class="record-title">{{ item.name }}</text><text class="record-copy">{{ item.value }}</text></view><text class="record-status">{{ item.level }}</text></view></view><button class="primary-button" @tap="showAssessmentToast">预约下次评估</button></view>
          <view v-else-if="detailView === 'team'" class="detail-content team-detail" data-testid="team-screen">
            <DetailIntro kicker="健康组队" title="小伙伴一起坚持" copy="组队只分享打卡状态，不展示心率、血氧或医院处方等健康隐私数据。" />
            <view class="team-hero"><view class="team-avatar-stack"><view>喜</view><view>康</view><view>动</view><view>+2</view></view><text class="team-name">小喜鹊7天轻运动队</text><text class="team-meta">5 / 6 人 · 本周共打卡 23 次</text><view class="team-progress"><view style="width: 68%" /></view><text class="team-progress-copy">团队目标完成 68%</text></view>
            <view v-if="teamJoined" class="team-members"><text class="form-title">队伍成员</text><view v-for="member in teamMembers" :key="member.name" class="team-member"><view>{{ member.name.slice(0, 1) }}</view><view><text>{{ member.name }}</text><text>{{ member.status }}</text></view><text>{{ member.streak }}天</text></view><view class="team-invite-code"><text>邀请码</text><text>XQ-7DAY</text></view></view>
            <view v-else class="team-join-card"><text class="form-title">加入演示队伍</text><text>加入后即可看到伙伴打卡状态和团队周目标。</text><button class="primary-button" data-testid="join-team" @tap="joinDemoTeam">使用邀请码 XQ-7DAY 加入</button></view>
            <view class="team-boundary"><text>隐私说明</text><text>队友只能看到“今日已打卡 / 未打卡”和连续天数，无法查看个人健康档案。</text></view>
          </view>
          <view v-else-if="detailView === 'reward-store'" class="detail-content"><DetailIntro kicker="演示积分体系" title="积分与徽章" :copy="'当前有 ' + points + ' 积分。所有兑换均为原型演示。'" /><view class="reward-grid"><view v-for="reward in visibleRewards" :key="reward.id" class="reward-card"><view class="reward-icon">{{ reward.icon }}</view><text class="reward-name">{{ reward.name }}</text><text class="reward-description">{{ reward.description }}</text><button :disabled="points < reward.cost" @tap="redeemReward(reward)">{{ reward.cost }} 积分</button></view></view></view>
        </scroll-view>
      </view>
    </template>

    <view v-if="showAiBoundary" class="modal-mask" @tap.self="showAiBoundary = false"><view class="modal-card"><image class="modal-mascot" :src="magpieAsset" mode="aspectFit" /><text class="modal-title">小喜能做什么？</text><text class="modal-copy">解释训练、报告、设备和通用健康知识；不能诊断疾病、调整药物或康复处方。</text><text class="modal-emergency">持续胸痛、呼吸困难或意识异常时，请立即停止运动并呼叫 120。</text><button class="primary-button" @tap="showAiBoundary = false">我知道了</button></view></view>
    <view v-if="showStopReason" class="modal-mask" @tap.self="showStopReason = false"><view class="modal-card"><view class="stop-icon">停</view><text class="modal-title">请立即停止运动</text><text class="modal-copy">坐下或平躺休息，避免继续用力。症状明显、持续或加重时请联系医生；紧急情况呼叫120。</text><button class="primary-button danger-primary" @tap="stopTraining">停止并记录</button><button class="text-button" @tap="showStopReason = false">返回训练</button></view></view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import AssistantPanel from '@/components/AssistantPanel.vue'
import DetailIntro from '@/components/DetailIntro.vue'
import KnowledgeHub from '@/components/KnowledgeHub.vue'
import MagpieMotion from '@/components/MagpieMotion.vue'
import StepIndicator from '@/components/StepIndicator.vue'
import TrainingExperience from '@/components/TrainingExperience.vue'
import VitalForm from '@/components/VitalForm.vue'
import { activities } from '@/lib/rive-motion'
import { assessmentItems, calendarDays, exerciseGames, knowledgeItems, navItems, patientMetrics, publicMetrics, rewardItems, type ActivityResult, type DetailView, type ExerciseGameId, type KnowledgeCategory, type KnowledgeItem, type NavId, type RewardItem, type RewardLedger, type TrainingSession, type TrainingStatus, type UserMode } from '@/lib/prototype-data'
import { isPrescriptionExercise, isSupportedPatientNo, sharedPatientFixture } from '@/lib/shared-patient'

type OnboardingStep = 'mode' | 'binding'
type BindingState = 'idle' | 'loading' | 'matched' | 'error'
const STORAGE_KEY = 'magpie-partner-v2'
const appReady = ref(false)
const onboardingStep = ref<OnboardingStep>('mode')
const mode = ref<UserMode>('public')
const visitNumber = ref('')
const bindingState = ref<BindingState>('idle')
const activeNav = ref<NavId>('home')
const detailView = ref<DetailView>('none')
const detailReturnNav = ref<NavId>('home')
const knowledgeCategory = ref<KnowledgeCategory>('recommended')
const knowledgeQuery = ref('')
const knowledgeScrollTop = ref(0)
const selectedKnowledgeId = ref(knowledgeItems[0].id)
const selectedGameId = ref<ExerciseGameId>('baduanjin')
const trainingStatus = ref<TrainingStatus>('idle')
const elapsed = ref(0)
const repCount = ref(0)
const repStreak = ref(0)
const rhythmHits = ref(0)
const rhythmTotal = ref(0)
const rhythmCombo = ref(0)
const demoCompleted = ref(false)
const cameraStatus = ref<'idle' | 'requesting' | 'ready' | 'denied'>('idle')
const preSymptoms = ref<string[]>([])
const postFeeling = ref('适中')
const stoppedReason = ref('')
const points = ref(160)
const streak = ref(6)
const checkInDone = ref(false)
const teamJoined = ref(false)
const sessions = ref<TrainingSession[]>([])
const rewardLedger = ref<RewardLedger>({ date: todayKey(), exerciseIds: [], prescriptionBonusAwarded: false })
const deviceConnected = ref(false)
const showAiBoundary = ref(false)
const showStopReason = ref(false)
const magpieAsset = '/static/rive-source/v4/master/magpie-neutral-master-v4.png'
const preVitals = reactive({ sbp: '122', dbp: '76', hr: '68', spo2: '98', borg: 1 })
const postVitals = reactive({ sbp: '126', dbp: '78', hr: '76', spo2: '98', borg: 3 })
const symptomOptions = [{ value: 'chest-pain', label: '胸痛或胸部不适' }, { value: 'dyspnea', label: '明显气促或呼吸困难' }, { value: 'dizzy', label: '头晕、乏力或意识异常' }, { value: 'palpitation', label: '持续或明显心悸' }]
const teamMembers = [
  { name: '运动伙伴', status: '今日已打卡', streak: 7 },
  { name: '康姐', status: '今日已打卡', streak: 12 },
  { name: '小动', status: '今日待打卡', streak: 4 },
  { name: '林叔', status: '今日已打卡', streak: 9 },
]
let trainingTimer: ReturnType<typeof setInterval> | undefined

const prescriptionExerciseId = computed<ExerciseGameId | undefined>(() => sharedPatientFixture.prescription.items.find((item) => item.appExerciseId)?.appExerciseId || undefined)
const featuredGame = computed(() => mode.value === 'cardiac' && prescriptionExerciseId.value ? exerciseGames.find((item) => item.id === prescriptionExerciseId.value) || exerciseGames[0] : exerciseGames[0])
const featuredActivity = computed(() => activities.find((item) => item.id === featuredGame.value.activityId) || activities[0])
const featuredBenefits = computed(() => ({ baduanjin: ['舒展呼吸', '动作跟练'], resistance: ['增强力量', '12次互动'], music: ['节奏放松', '3组节拍'] }[featuredGame.value.id]))
const selectedGame = computed(() => exerciseGames.find((item) => item.id === selectedGameId.value) || exerciseGames[0])
const selectedKnowledgeItem = computed(() => knowledgeItems.find((item) => item.id === selectedKnowledgeId.value) || knowledgeItems[0])
const todayActivity = computed(() => activities.find((item) => item.id === selectedGame.value.activityId) || activities[0])
const currentMetrics = computed(() => mode.value === 'cardiac' ? patientMetrics : publicMetrics)
const displayName = computed(() => mode.value === 'cardiac' ? sharedPatientFixture.patient.maskedName : '运动伙伴')
const greeting = computed(() => new Date().getHours() < 12 ? '上午好' : new Date().getHours() < 18 ? '下午好' : '晚上好')
const todayLabel = computed(() => `${new Date().getMonth() + 1} 月 ${new Date().getDate()} 日 · 科学运动，轻松坚持`)
const formattedElapsed = computed(() => formatTimer(elapsed.value))
const activityScore = computed(() => selectedGameId.value === 'baduanjin' ? Math.min(96, 82 + Math.floor(elapsed.value / 15)) : selectedGameId.value === 'resistance' ? Math.round(repCount.value / 12 * 100) : Math.round(rhythmHits.value / Math.max(1, rhythmTotal.value) * 100))
const rhythmRound = computed(() => Math.min(3, Math.max(1, Math.ceil(rhythmTotal.value / 8))))
const isCurrentPrescription = computed(() => mode.value === 'cardiac' && isPrescriptionExercise(selectedGameId.value))
const latestSession = computed(() => sessions.value[0])
const completedTodaySessions = computed(() => sessions.value.filter((item) => item.status === 'completed' && item.createdAt.startsWith(todayKey())))
const completedSessionCount = computed(() => sessions.value.filter((item) => item.status === 'completed').length)
const completedExerciseCount = computed(() => new Set(completedTodaySessions.value.map((item) => item.exerciseId)).size)
const completedMinutes = computed(() => Math.round(completedTodaySessions.value.reduce((sum, item) => sum + item.durationSeconds, 0) / 60))
const taskCompleted = computed(() => completedTodaySessions.value.length > 0)
const visibleRewards = computed(() => rewardItems.filter((item) => item.audience === 'all' || (item.audience === 'cardiac' && mode.value === 'cardiac')))
const detailTitle = computed(() => ({ precheck: '运动前检查', training: selectedGame.value.title, postcheck: '运动后记录', 'session-report': '本次运动报告', 'hospital-report': '医院运动记录', 'health-archive': '健康档案', devices: '设备与数据来源', 'knowledge-article': '知识详情', 'knowledge-video': '健康短视频', assessment: '体适能评估', team: '健康组队', 'reward-store': '积分与徽章', none: '' }[detailView.value]))

function todayKey() { return new Date().toISOString().slice(0, 10) }
function formatTimer(value: number) { return `${Math.floor(value / 60).toString().padStart(2, '0')}:${(value % 60).toString().padStart(2, '0')}` }
function formatDuration(value: number) { return value >= 60 ? `${Math.floor(value / 60)}分${value % 60 ? value % 60 + '秒' : ''}` : `${value}秒` }
function chooseMode(value: UserMode) { mode.value = value; if (value === 'public') enterApp(); else onboardingStep.value = 'binding' }
function backToMode() { onboardingStep.value = 'mode'; bindingState.value = 'idle'; visitNumber.value = '' }
function bindPatient() { if (bindingState.value === 'matched') { enterApp(); return }; bindingState.value = 'loading'; setTimeout(() => { bindingState.value = isSupportedPatientNo(visitNumber.value) ? 'matched' : 'error' }, 450) }
function enterApp() { appReady.value = true; activeNav.value = 'home'; persistState() }
function switchMode() { appReady.value = false; onboardingStep.value = 'mode'; bindingState.value = 'idle'; visitNumber.value = ''; activeNav.value = 'home' }
function selectExercise(id: ExerciseGameId) { detailReturnNav.value = activeNav.value; selectedGameId.value = id; resetTraining(); if (mode.value === 'cardiac') { trainingStatus.value = 'checking'; detailView.value = 'precheck' } else startTraining() }
function resetTraining() { stopTimer(); trainingStatus.value = 'idle'; elapsed.value = 0; repCount.value = 0; repStreak.value = 0; rhythmHits.value = 0; rhythmTotal.value = 0; rhythmCombo.value = 0; preSymptoms.value = []; postFeeling.value = '适中'; stoppedReason.value = ''; demoCompleted.value = false; cameraStatus.value = 'idle' }
function updateSymptoms(event: { detail: { value: string[] } }) { preSymptoms.value = event.detail.value }
function startTraining() { if (mode.value === 'cardiac' && preSymptoms.value.length) { showStopReason.value = true; return }; detailView.value = 'training'; trainingStatus.value = 'active'; elapsed.value = 0; startTimer() }
function startTimer() { stopTimer(); trainingTimer = setInterval(() => { if (trainingStatus.value === 'active') { elapsed.value += 1; if (elapsed.value >= 180) finishTraining(false) } }, 1000) }
function stopTimer() { if (trainingTimer) clearInterval(trainingTimer); trainingTimer = undefined }
function toggleTraining() { trainingStatus.value = trainingStatus.value === 'paused' ? 'active' : 'paused' }
function recordRep() { if (trainingStatus.value !== 'active' || repCount.value >= 12) return; repCount.value += 1; repStreak.value += 1 }
function recordBeat() { if (trainingStatus.value !== 'active' || rhythmHits.value >= 24) return; rhythmTotal.value += 1; if (rhythmTotal.value % 7 === 0) rhythmCombo.value = 0; else { rhythmHits.value += 1; rhythmCombo.value += 1 } }
function finishTraining(isDemo: boolean) { if (isDemo) { elapsed.value = 180; if (selectedGameId.value === 'resistance') { repCount.value = 12; repStreak.value = 12 }; if (selectedGameId.value === 'music') { rhythmHits.value = 24; rhythmTotal.value = 26; rhythmCombo.value = 8 }; demoCompleted.value = true }; stopTimer(); trainingStatus.value = 'completed'; detailView.value = 'postcheck' }
function stopTraining() { stopTimer(); showStopReason.value = false; trainingStatus.value = 'stopped'; stoppedReason.value = '用户主动报告身体不适'; detailView.value = 'postcheck' }
function resultItems(): ActivityResult[] { if (selectedGameId.value === 'baduanjin') return [{ label: '动作模拟评分', value: `${activityScore.value} 分` }, { label: '摄像头状态', value: cameraStatus.value === 'ready' ? '已开启' : '未启用/演示' }]; if (selectedGameId.value === 'resistance') return [{ label: '完成次数', value: `${repCount.value} / 12` }, { label: '连续完成', value: `${repStreak.value} 次` }]; return [{ label: '节拍命中', value: `${rhythmHits.value} / ${rhythmTotal.value}` }, { label: '命中准确率', value: `${activityScore.value}%` }, { label: '完成组数', value: `${rhythmRound.value} / 3` }] }
function generateReport() {
  if (rewardLedger.value.date !== todayKey()) rewardLedger.value = { date: todayKey(), exerciseIds: [], prescriptionBonusAwarded: false }
  let awarded = 0
  if (trainingStatus.value === 'completed' && !rewardLedger.value.exerciseIds.includes(selectedGameId.value)) { awarded += 10; rewardLedger.value.exerciseIds.push(selectedGameId.value) }
  if (trainingStatus.value === 'completed' && isCurrentPrescription.value && !rewardLedger.value.prescriptionBonusAwarded) { awarded += 10; rewardLedger.value.prescriptionBonusAwarded = true }
  points.value += awarded
  if (trainingStatus.value === 'completed') streak.value = Math.max(streak.value, 7)
  sessions.value.unshift({ id: `SESSION-${Date.now()}`, exerciseId: selectedGameId.value, title: selectedGame.value.title, mode: mode.value, planType: isCurrentPrescription.value ? 'prescription' : 'self-directed', status: trainingStatus.value, durationSeconds: Math.min(180, elapsed.value), demoCompleted: demoCompleted.value, stoppedReason: stoppedReason.value || undefined, score: activityScore.value, results: resultItems(), createdAt: new Date().toISOString(), pointsAwarded: awarded })
  persistState(); detailView.value = 'session-report'; uni.showToast({ title: awarded ? `报告已生成，获得${awarded}积分` : '报告已生成', icon: 'none' })
}
function goDetail(view: DetailView) { if (view !== 'training') stopTimer(); detailReturnNav.value = activeNav.value; detailView.value = view }
function closeDetail() { stopTimer(); detailView.value = 'none'; activeNav.value = detailReturnNav.value }
function openKnowledge(category: KnowledgeCategory) { knowledgeCategory.value = category; knowledgeQuery.value = ''; knowledgeScrollTop.value = 0; activeNav.value = 'knowledge' }
function openKnowledgeItem(item: KnowledgeItem) { selectedKnowledgeId.value = item.id; detailReturnNav.value = 'knowledge'; detailView.value = item.type === 'video' ? 'knowledge-video' : 'knowledge-article' }
function rememberPageScroll(event: { detail: { scrollTop: number } }) { if (activeNav.value === 'knowledge') knowledgeScrollTop.value = event.detail.scrollTop }
function simulateSync() { deviceConnected.value = true; uni.showToast({ title: '已完成模拟连接', icon: 'none' }) }
function handleDailyCheckIn() {
  if (checkInDone.value) { uni.showToast({ title: '今日已完成打卡', icon: 'none' }); return }
  checkInDone.value = true
  streak.value += 1
  points.value += 5
  persistState()
  uni.showToast({ title: '打卡成功，获得5积分', icon: 'none' })
}
function joinDemoTeam() { teamJoined.value = true; persistState(); uni.showToast({ title: '已加入小喜鹊运动队', icon: 'none' }) }
function showAssessmentToast() { uni.showToast({ title: '评估预约为原型演示功能', icon: 'none' }) }
function redeemReward(reward: RewardItem) { if (points.value < reward.cost) return; points.value -= reward.cost; persistState(); uni.showModal({ title: '演示兑换成功', content: `已模拟兑换“${reward.name}”，不会产生真实权益或物流。`, showCancel: false }) }
function persistState() { uni.setStorageSync(STORAGE_KEY, { ready: appReady.value, mode: mode.value, points: points.value, streak: streak.value, checkInDate: checkInDone.value ? todayKey() : '', teamJoined: teamJoined.value, sessions: sessions.value, rewardLedger: rewardLedger.value }) }
function resetPrototype() { stopTimer(); uni.removeStorageSync(STORAGE_KEY); appReady.value = false; onboardingStep.value = 'mode'; mode.value = 'public'; bindingState.value = 'idle'; visitNumber.value = ''; activeNav.value = 'home'; detailView.value = 'none'; points.value = 160; streak.value = 6; checkInDone.value = false; teamJoined.value = false; sessions.value = []; rewardLedger.value = { date: todayKey(), exerciseIds: [], prescriptionBonusAwarded: false } }
onMounted(() => { const saved = uni.getStorageSync(STORAGE_KEY); if (saved?.ready) { mode.value = saved.mode === 'cardiac' ? 'cardiac' : 'public'; points.value = Number(saved.points) || 160; streak.value = Number(saved.streak) || 6; checkInDone.value = saved.checkInDate === todayKey(); teamJoined.value = Boolean(saved.teamJoined); sessions.value = Array.isArray(saved.sessions) ? saved.sessions : []; rewardLedger.value = saved.rewardLedger?.date ? saved.rewardLedger : rewardLedger.value; appReady.value = true } })
onUnmounted(stopTimer)
</script>

<style lang="scss" src="./index.scss"></style>
