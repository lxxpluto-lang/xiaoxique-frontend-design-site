<template>
  <view class="prototype-shell" :data-user-mode="mode">
    <view v-if="!appReady" class="onboarding">
      <view class="brand-row"><view class="brand-mark"><image :src="magpieAsset" mode="aspectFit" /></view><view><text class="brand-name">小喜鹊</text><text class="brand-caption">科学运动，轻松坚持</text></view></view>
      <view v-if="onboardingStep === 'mode'" class="onboarding-card" data-testid="onboarding-mode">
        <image class="welcome-magpie" :src="magpieAsset" mode="aspectFit" />
        <text class="panel-kicker">选择使用方式</text><text class="panel-title">今天从哪里开始？</text>
        <button class="mode-card mode-card--public" data-testid="choose-public" @tap="chooseMode('public')"><view class="mode-icon"><AppIcon src="/static/icons/magpie-line/exercise.svg" :size="46" /></view><view><text>日常运动</text><text>无需评估，直接开始今日运动</text></view><text>›</text></button>
        <button class="mode-card" data-testid="choose-cardiac" @tap="chooseMode('cardiac')"><view class="mode-icon"><AppIcon src="/static/icons/magpie-line/heart-rate.svg" :size="46" /></view><view><text>心脏康复</text><text>关联医院计划，按策略记录状态</text></view><text>›</text></button>
        <button class="text-button" @tap="showAiBoundary = true">健康助手与医疗边界</button>
      </view>
      <view v-else class="onboarding-card" data-testid="onboarding-binding">
        <button class="back-link" @tap="backToMode">‹ 返回</button><text class="panel-kicker">关联康复计划</text><text class="panel-title">输入患者号</text><text class="panel-copy">演示支持 {{ sharedPatientFixture.hospital.name }}</text>
        <view class="field-block"><text>医院</text><view class="hospital-select"><AppIcon src="/static/icons/magpie-line/archive.svg" :size="32" /><text>{{ sharedPatientFixture.hospital.name }}</text><text>✓</text></view></view>
        <view class="field-block"><text>患者号</text><input v-model="visitNumber" class="text-input" data-testid="visit-number" placeholder="输入 256572 或 P-256572" maxlength="16" /></view>
        <view v-if="bindingState === 'matched'" class="match-card"><text>✓</text><view><text>已匹配康复计划</text><text>{{ sharedPatientFixture.patient.maskedName }} · {{ sharedPatientFixture.patient.rehabStage }}</text><text>{{ sharedPatientFixture.prescription.prescriptionNo }} · {{ sharedPatientFixture.prescription.version }}</text></view></view>
        <text v-if="bindingState === 'error'" class="form-error">未找到计划，请检查患者号。</text>
        <button class="primary-button" :loading="bindingState === 'loading'" data-testid="bind-plan" @tap="bindPatient">{{ bindingState === 'matched' ? '进入今日计划' : '查询计划' }}</button>
      </view>
    </view>

    <template v-else>
      <view v-if="detailView === 'none'" class="app-frame">
        <view class="topbar"><view><text class="topbar-title">{{ topbarTitle }}</text><text class="topbar-copy">{{ todayLabel }}</text></view><button class="avatar-button" @tap="activeNav = 'profile'">{{ displayName.slice(0, 1) }}</button></view>
        <scroll-view class="page-scroll" scroll-y>
          <view v-if="activeNav === 'today'" class="screen today-screen" data-testid="today-screen">
            <view class="today-glance"><view><text>{{ checkInDone ? '今日已打卡' : '今日待完成' }}</text><text>连续 {{ streak }} 天</text></view><button @tap="openData('checkin')">日历 ›</button></view>
            <view class="section-heading"><view><text>今日运动</text><text>{{ planReason }}</text></view></view>
            <view class="today-task" :class="{ complete: taskCompleted }" data-testid="today-core-task">
              <view class="task-media"><MagpieMotion :label="featuredActivity.title" :video-src="featuredActivity.video" :poster="featuredActivity.poster" :riv-src="featuredActivity.rive.enabled ? featuredActivity.rive.src : ''" :artboard="featuredActivity.rive.artboard" :state-machine="featuredActivity.rive.stateMachine" :fit="featuredActivity.rive.fit" /></view>
              <view class="task-body"><view class="tag-row"><text>{{ taskCompleted ? '已完成' : mode === 'cardiac' ? '医院计划' : '今日推荐' }}</text><text>{{ featuredGame.duration }}</text><text v-if="featuredGame.arSupported">AR互动</text></view><text class="task-title">{{ featuredGame.title }}</text><text class="task-copy">{{ featuredGame.subtitle }}</text><text v-if="planAdjustment" class="plan-adjustment">医生已确认：{{ planAdjustment }}</text><button data-testid="start-today-plan" @tap="handleTodayPrimary">{{ taskCompleted ? '查看本次解读' : '开始运动' }}</button></view>
            </view>
            <button class="weekly-entry" data-testid="weekly-path-entry" @tap="goDetail('weekly-path')"><view><text>本周路径</text><text>已完成 {{ weeklyCompletedDays }}/7 天</text></view><view class="weekly-mini"><text v-for="day in weeklyPlanDays" :key="day.label" :class="{ done: day.done, today: day.today }">{{ day.done ? '✓' : day.label }}</text></view><text>›</text></button>
            <view class="section-heading"><view><text>按类型选择</text><text>每类只推荐一个</text></view></view>
            <view class="category-grid"><button v-for="category in exerciseCategories" :key="category.id" @tap="openCategory(category.id)"><view><AppIcon :src="category.iconPath" :size="38" color="#11866F" /></view><text>{{ category.shortTitle }}</text></button></view>
          </view>

          <view v-else-if="activeNav === 'discover'" class="discover-screen" data-testid="discover-screen">
            <CompanionHub v-model:active-tab="socialTab" :team-joined="teamJoined" :team-state="teamState" :team-members="teamMembers" :team-checked-count="teamCheckedCount" :team-progress="teamProgress" :buddy-state="buddyState" :buddy-day="buddyDay" :check-in-done="checkInDone" :today-key="todayKey()" @create-team="createDemoTeam" @join-team="joinTeamByCode" @join-demo-team="joinDemoTeam" @remind-team="remindTeamMember" @set-buddy-cycle="setBuddyCycle" @connect-buddy="connectDemoBuddy" @remind-buddy="remindBuddy" />
            <KnowledgeHub :mode="mode" :items="knowledgeItems" @open="openKnowledgeItem" />
          </view>

          <AssistantPanel v-else-if="activeNav === 'assistant'" class="screen" :mode="mode" :display-name="displayName" :mascot="magpieAsset" :completed-count="completedExerciseCount" :streak="streak" :plan-title="featuredGame.title + ' ' + featuredGame.duration" :plan-completed="taskCompleted" :latest-advice="latestAdvice" @start-plan="selectExercise(featuredGame.id)" @open-reports="openLatestReport" @open-devices="goDetail('devices')" @open-profile="goDetail('health-archive')" />

          <view v-else-if="activeNav === 'data'" class="screen data-screen" data-testid="data-screen">
            <view class="page-heading"><text>我的数据</text><text>看变化，也看数据来源</text></view>
            <view class="data-tabs"><button v-for="tab in dataTabs" :key="tab.id" :class="{ active: dataTab === tab.id }" :data-testid="'data-tab-' + tab.id" @tap="dataTab = tab.id">{{ tab.label }}</button></view>
            <view v-if="dataTab === 'overview'" class="data-panel">
              <view class="today-numbers"><view><text>{{ completedMinutes }}</text><text>今日分钟</text></view><view><text>{{ completedExerciseCount }}</text><text>完成项目</text></view><view><text>{{ streak }}</text><text>连续天数</text></view></view>
              <button v-if="latestAdvice" class="latest-advice" :class="'level-' + latestAdvice.level" @tap="openLatestReport"><view><text>最新解读</text><text>{{ latestAdvice.title }}</text><text>{{ latestAdvice.summary }}</text></view><text>›</text></button>
              <view v-else class="empty-card">完成一次运动后，小喜会在这里显示简短解读。</view>
              <view class="section-heading"><view><text>身体数据</text><text>缺失与过期不会显示为正常</text></view><button @tap="goDetail('devices')">数据来源 ›</button></view>
              <view class="metric-row"><view v-for="metric in visibleMetrics" :key="metric.label"><text>{{ metric.label }}</text><text>{{ metric.value }}<text class="metric-unit">{{ metric.unit }}</text></text><text>{{ metric.source }}</text></view></view>
              <view class="section-heading"><view><text>近7次活动</text><text>只看趋势，不做诊断</text></view></view><view class="trend-chart"><view v-for="(bar,index) in trendBars" :key="index"><view :style="{ height: bar + '%' }" /><text>{{ index + 1 }}</text></view></view>
            </view>
            <view v-else-if="dataTab === 'checkin'" class="data-panel" data-testid="checkin-panel">
              <view class="checkin-hero"><view><text>{{ checkInDone ? '今天已自动打卡' : '完成核心运动后自动打卡' }}</text><text>连续 {{ streak }} 天 · 累计 {{ totalCheckInDays }} 天</text></view><text>{{ checkInDone ? '✓' : streak }}</text></view>
              <view class="calendar-card"><view class="calendar-heading"><button @tap="shiftCalendarMonth(-1)">‹</button><text>{{ calendarTitle }}</text><button :disabled="!canGoNextMonth" @tap="shiftCalendarMonth(1)">›</button></view><view class="calendar-week"><text v-for="day in ['一','二','三','四','五','六','日']" :key="day">{{ day }}</text></view><view class="calendar-grid"><view v-for="item in calendarCells" :key="item.key" :class="{ blank: item.blank, done: item.checked, today: item.today, future: item.future }"><text v-if="!item.blank">{{ item.day }}</text><text v-if="item.checked">✓</text></view></view></view>
              <view class="milestone-list"><view v-for="item in rewardMilestones" :key="item.day" :class="{ reached: streak >= item.day }"><text>{{ item.day }}天</text><text>{{ item.label }}</text><text>+{{ item.bonus }}</text></view></view>
            </view>
            <view v-else class="data-panel history-list" data-testid="history-panel">
              <button v-for="session in sessions" :key="session.id" @tap="openSession(session)"><view class="history-icon">{{ session.status === 'stopped' ? '停' : '动' }}</view><view><text>{{ session.title }}</text><text>{{ formatDateTime(session.createdAt) }} · {{ formatDuration(session.durationSeconds) }}</text><text v-if="session.advice" :class="'level-text-' + session.advice.level">{{ session.advice.title }}</text><text v-else>未进行状态评估</text></view><text>›</text></button><view v-if="!sessions.length" class="empty-card">还没有运动记录。</view>
            </view>
          </view>

          <view v-else class="screen profile-screen" data-testid="profile-screen">
            <view class="profile-card"><view class="profile-avatar">{{ displayName.slice(0, 1) }}</view><view><text>{{ mode === 'cardiac' ? sharedPatientFixture.patient.name : '运动伙伴' }}</text><text>{{ mode === 'cardiac' ? sharedPatientFixture.hospital.shortName + ' · ' + sharedPatientFixture.patient.patientNo : '日常运动用户' }}</text></view><button @tap="goDetail('health-archive')">资料 ›</button></view>
            <view class="wallet-card"><button @tap="goDetail('reward-store')"><text>{{ wallet.healthPoints }}</text><text>健康积分</text></button><button v-if="mem.unlocked" @tap="goDetail('reward-store')"><text>{{ wallet.mCoins }}</text><text>M币</text></button><button v-else @tap="focusMemUnlock"><text>MEM</text><text>学生权益</text></button></view>
            <view v-if="!mem.unlocked" class="mem-unlock" data-testid="mem-unlock"><text>解锁MEM学生权益</text><view><input v-model="memCode" placeholder="邀请码 MEM-2026" /><button @tap="unlockMem">解锁</button></view></view>
            <view v-else class="mem-status"><view><text>MEM 7日挑战</text><text>连续 {{ memChallengeDays }}/7 天 · 每天满15分钟</text></view><button :disabled="wallet.healthPoints < 100" @tap="convertPoints">100积分换5M币</button></view>
            <view class="profile-section"><text>健康管理</text><view class="service-list"><button @tap="goDetail('devices')"><AppIcon src="/static/icons/magpie-line/device.svg" :size="34" /><view><text>设备与授权</text><text>{{ deviceConnected ? '模拟设备已连接' : '管理数据来源' }}</text></view><text>›</text></button><button @tap="goDetail('health-archive')"><AppIcon src="/static/icons/magpie-line/archive.svg" :size="34" /><view><text>健康档案</text><text>目标、计划与数据来源</text></view><text>›</text></button><button @tap="goDetail('reward-store')"><AppIcon src="/static/icons/magpie-line/badge.svg" :size="34" /><view><text>积分、M币与礼品</text><text>双钱包独立记录</text></view><text>›</text></button></view></view>
            <view class="profile-section"><text>原型设置</text><view class="service-list"><button @tap="goDetail('prototype-policy')"><AppIcon src="/static/icons/magpie-line/safety.svg" :size="34" /><view><text>训练状态策略</text><text>患者策略 v{{ publishedPolicy.version }}</text></view><text>›</text></button><button @tap="goDetail('doctor-reviews')"><AppIcon src="/static/icons/magpie-line/report.svg" :size="34" /><view><text>医生审核队列</text><text>{{ pendingReviewCount }} 条待处理</text></view><text>›</text></button></view></view>
            <view class="profile-actions"><button @tap="switchMode">切换使用模式</button><button @tap="showAiBoundary = true">隐私与医疗边界</button><button @tap="resetPrototype">重置原型</button></view>
          </view>
        </scroll-view>
        <view class="bottom-nav"><button v-for="item in navItems" :key="item.id" :class="{ active: activeNav === item.id, assistant: item.id === 'assistant' }" @tap="activeNav = item.id"><view><image v-if="item.mascotPath" :src="item.mascotPath" mode="aspectFit" /><AppIcon v-else :src="item.iconPath" :size="38" :active="activeNav === item.id" :color="activeNav === item.id ? '#11866F' : '#73817D'" /></view><text>{{ item.label }}</text></button></view>
      </view>

      <view v-else class="detail-frame" :data-detail-view="detailView">
        <view class="detail-header"><button @tap="closeDetail">‹</button><text>{{ detailTitle }}</text><button @tap="showAiBoundary = true">?</button></view>
        <scroll-view class="detail-scroll" scroll-y>
          <view v-if="detailView === 'weekly-path'" class="detail-content"><DetailIntro kicker="本周运动路径" title="一天一个小节点" copy="普通中断不扣分、不清空计划。" /><view class="path-list"><button v-for="day in weeklyPlanDays" :key="day.label" :class="{ done: day.done, today: day.today }" @tap="day.today && selectExercise(day.gameId)"><text>{{ day.done ? '✓' : day.index }}</text><view><text>周{{ day.label }} · {{ day.game.title }}</text><text>{{ day.game.duration }} · {{ day.today ? '今天' : day.done ? '已完成' : '待开始' }}</text></view><text>{{ day.today ? '开始 ›' : '' }}</text></button></view></view>

          <view v-else-if="detailView === 'exercise-category'" class="detail-content"><DetailIntro kicker="运动分类" :title="selectedCategory.title" :copy="selectedCategory.description" /><view class="category-recommend"><image :src="categoryRecommendedGame.poster" mode="aspectFill" /><view><text>推荐</text><text>{{ categoryRecommendedGame.title }}</text><text>{{ categoryRecommendedGame.subtitle }}</text><button @tap="selectExercise(categoryRecommendedGame.id)">开始 {{ categoryRecommendedGame.duration }}</button></view></view><view class="simple-exercise-list"><button v-for="game in categoryGames" :key="game.id" @tap="selectExercise(game.id)"><view><text>{{ game.title }}</text><text>{{ game.feature }}<text v-if="game.arSupported"> · AR互动</text></text></view><text>{{ game.duration }} ›</text></button></view></view>

          <view v-else-if="detailView === 'precheck'" class="detail-content" data-testid="precheck-screen"><StepIndicator :current="1" /><view class="policy-banner"><view><text>患者训练状态策略</text><text>训练前{{ modeLabel(publishedPolicy.preMode) }} · v{{ publishedPolicy.version }}</text></view><button @tap="simulateVitalSync('pre')">重新同步</button></view><view class="vital-source" :class="'quality-' + preSnapshot.quality"><view><AppIcon src="/static/icons/magpie-line/device.svg" :size="34" /><view><text>{{ sourceLabel(preSnapshot.source) }}</text><text>{{ qualityLabel(preSnapshot.quality) }} · {{ formatTime(preSnapshot.measuredAt) }}</text></view></view><text>{{ preSnapshot.quality === 'valid' ? '已同步' : '需处理' }}</text></view><view v-if="publishedPolicy.fields.symptoms" class="form-card"><text class="form-title">现在是否有不适？</text><checkbox-group class="symptom-list" @change="updatePreSymptoms"><label v-for="item in symptomOptions" :key="item.value"><checkbox :value="item.value" color="#11866F" /><text>{{ item.label }}</text></label></checkbox-group><text v-if="preSnapshot.symptoms.length" class="danger-note">不建议开始运动，请停止并按提示处理。</text></view><view class="vital-form"><label v-if="publishedPolicy.fields.heartRate"><text>心率</text><view><input v-model.number="preSnapshot.heartRate" type="number" /><text>次/分</text></view></label><label v-if="publishedPolicy.fields.oxygenSaturation"><text>血氧</text><view><input v-model.number="preSnapshot.oxygenSaturation" type="number" /><text>%</text></view></label></view><button v-if="preSnapshot.quality !== 'valid'" class="text-button" @tap="useManualSnapshot('pre')">标记为外部设备读数</button><view v-if="publishedPolicy.fields.borg" class="form-card"><text class="form-title">Borg用力感 {{ preSnapshot.borg }}</text><slider :value="preSnapshot.borg" min="0" max="10" activeColor="#11866F" @change="setSnapshotBorg('pre',$event)" /></view><button v-if="preSnapshot.symptoms.length" class="danger-primary" @tap="stopBeforeStart">停止本次并生成记录</button><button v-else class="primary-button" :disabled="publishedPolicy.preMode === 'required' && !preReady" data-testid="begin-training" @tap="startTraining">开始{{ selectedGame.title }}</button><button v-if="publishedPolicy.preMode === 'optional'" class="text-button" @tap="skipPre">跳过本次记录</button></view>

          <view v-else-if="detailView === 'training'" class="detail-content training-detail" data-testid="training-screen"><view class="training-strip"><view><text>{{ trainingStatus === 'paused' ? '已暂停' : '训练中' }}</text><text>{{ selectedGame.title }}</text></view><view><text>{{ formattedElapsed }}</text><text>/ {{ formatTimer(trainingTargetSeconds) }}</text></view></view><TrainingExperience :game="selectedGame" :activity="todayActivity" :score="activityScore" :paused="trainingStatus === 'paused'" :rep-count="repCount" :rhythm-hits="rhythmHits" :rhythm-combo="rhythmCombo" :rhythm-round="rhythmRound" @camera-status="cameraStatus = $event" @rep="recordRep" @beat="recordBeat" /><view class="exercise-controls"><button @tap="toggleTraining">{{ trainingStatus === 'paused' ? '继续' : '暂停' }}</button><button class="danger-button" @tap="showStopReason = true">我有不适</button></view><button class="primary-button" data-testid="demo-complete" @tap="finishTraining(true)">快速完成演示</button><button class="text-button" @tap="finishTraining(false)">结束本次运动</button></view>

          <view v-else-if="detailView === 'postcheck'" class="detail-content" data-testid="postcheck-screen"><StepIndicator :current="3" /><view class="policy-banner"><view><text>{{ trainingStatus === 'stopped' ? '训练已停止' : '缓和后记录' }}</text><text>训练后{{ modeLabel(publishedPolicy.postMode) }} · 3–5分钟恢复数据</text></view><button @tap="simulateVitalSync('post')">重新同步</button></view><view class="vital-source" :class="'quality-' + postSnapshot.quality"><view><AppIcon src="/static/icons/magpie-line/device.svg" :size="34" /><view><text>{{ sourceLabel(postSnapshot.source) }}</text><text>{{ qualityLabel(postSnapshot.quality) }} · {{ formatTime(postSnapshot.measuredAt) }}</text></view></view><text>{{ postSnapshot.quality === 'valid' ? '已同步' : '待补充' }}</text></view><view class="vital-form"><label v-if="publishedPolicy.fields.heartRate"><text>心率</text><view><input v-model.number="postSnapshot.heartRate" type="number" /><text>次/分</text></view></label><label v-if="publishedPolicy.fields.oxygenSaturation"><text>血氧</text><view><input v-model.number="postSnapshot.oxygenSaturation" type="number" /><text>%</text></view></label></view><button v-if="postSnapshot.quality !== 'valid'" class="text-button" @tap="useManualSnapshot('post')">标记为外部设备读数</button><view v-if="publishedPolicy.fields.borg" class="form-card"><text class="form-title">Borg用力感 {{ postSnapshot.borg }}</text><slider :value="postSnapshot.borg" min="0" max="10" activeColor="#11866F" @change="setSnapshotBorg('post',$event)" /></view><view v-if="publishedPolicy.fields.feeling" class="form-card"><text class="form-title">运动后感受</text><view class="feeling-row"><button v-for="feeling in ['轻松','适中','较累']" :key="feeling" :class="{ active: postSnapshot.feeling === feeling }" @tap="setPostFeeling(feeling)">{{ feeling }}</button></view></view><button class="primary-button" data-testid="generate-report" @tap="generateReport">{{ postReady ? '生成运动解读' : '保存记录并查看提示' }}</button><button v-if="publishedPolicy.postMode === 'optional'" class="text-button" @tap="skipPost">跳过本次记录</button></view>

          <view v-else-if="detailView === 'session-report'" class="detail-content" data-testid="session-report-screen"><view v-if="selectedSession" class="session-summary" :class="{ stopped: selectedSession.status === 'stopped' }"><view>{{ selectedSession.status === 'stopped' ? '停' : selectedSession.score }}</view><text>{{ selectedSession.status === 'stopped' ? '本次运动已停止并记录' : selectedSession.title + '完成' }}</text><text>{{ formatDuration(selectedSession.durationSeconds) }} · {{ selectedSession.pointsAwarded ? '+' + selectedSession.pointsAwarded + '积分' : '未新增积分' }}</text></view><view v-if="selectedSession?.assessment" class="comparison-card"><text class="form-title">训练前后变化</text><view><text>训练前</text><text>{{ snapshotSummary(selectedSession.assessment.pre) }}</text></view><view><text>训练后</text><text>{{ snapshotSummary(selectedSession.assessment.post) }}</text></view><text>{{ selectedSession.assessment.comparison }}</text></view><view v-if="selectedSession?.advice" class="advice-card" :class="'level-' + selectedSession.advice.level"><view class="advice-heading"><view><text>小喜解读</text><text>{{ selectedSession.advice.title }}</text></view><text>{{ adviceLevelLabel(selectedSession.advice.level) }}</text></view><text class="advice-summary">{{ selectedSession.advice.summary }}</text><view class="advice-list"><text>判断依据</text><view v-for="item in selectedSession.advice.evidence" :key="item">· {{ item }}</view></view><view class="advice-list"><text>下一步</text><view v-for="item in selectedSession.advice.actions" :key="item">· {{ item }}</view></view><text class="advice-source">{{ selectedSession.advice.sourceSummary }}</text><text class="advice-boundary">{{ selectedSession.advice.boundary }}</text></view><view v-if="selectedSession?.advice && reviewForAdvice(selectedSession.advice.id)" class="review-status"><text>医生审核</text><text>{{ reviewStatusLabel(reviewForAdvice(selectedSession.advice.id)!.status) }}</text></view><button class="primary-button" @tap="closeDetail">完成</button></view>

          <view v-else-if="detailView === 'devices'" class="detail-content"><DetailIntro kicker="数据来源" title="设备与授权" copy="手机负责授权和汇总，不被描述为血氧仪。" /><view class="device-platforms"><button v-for="source in deviceSources" :key="source.id" @tap="simulateDeviceConnect(source.id)"><view><text>{{ source.icon }}</text><view><text>{{ source.name }}</text><text>{{ source.copy }}</text></view></view><text>{{ deviceConnected ? '已模拟授权' : '去授权' }}</text></button></view><view class="privacy-card"><text>原型说明</text><text>App正式接入时按数据类型单独授权；H5和小程序使用模拟设备适配器，不读取真实健康数据。</text></view></view>

          <view v-else-if="detailView === 'health-archive'" class="detail-content"><DetailIntro kicker="统一健康档案" title="计划、数据与来源" copy="每条数据都标记来源、时间和质量。" /><view class="archive-card"><text class="form-title">当前目标</text><text>{{ healthGoalLabel }}</text><view v-if="mode === 'public'" class="goal-row"><button :class="{ active: healthGoal === 'habit' }" @tap="setHealthGoal('habit')">运动习惯</button><button :class="{ active: healthGoal === 'weight' }" @tap="setHealthGoal('weight')">健康减重</button></view></view><view class="archive-card"><text class="form-title">数据来源</text><view class="source-row"><text>运动记录</text><text>本机原型 · {{ sessions.length }}条</text></view><view class="source-row"><text>设备数据</text><text>{{ deviceConnected ? '模拟设备 · 已授权' : '未授权' }}</text></view><view v-if="mode === 'cardiac'" class="source-row"><text>医院计划</text><text>{{ sharedPatientFixture.prescription.version }}</text></view></view><view v-if="mode === 'cardiac'" class="archive-card"><text class="form-title">康复摘要</text><text>{{ sharedPatientFixture.patient.diagnosis }}</text><text>{{ sharedPatientFixture.patient.assignedDoctor }} · {{ sharedPatientFixture.patient.riskLevel }}</text></view></view>

          <view v-else-if="detailView === 'reward-store'" class="detail-content"><DetailIntro kicker="健康权益" title="积分、M币与礼品" copy="两个余额独立记录，身体数值不参与奖励。" /><view class="wallet-detail"><view><text>{{ wallet.healthPoints }}</text><text>健康积分</text></view><view v-if="mem.unlocked"><text>{{ wallet.mCoins }}</text><text>M币</text></view></view><button v-if="mem.unlocked" class="convert-button" :disabled="wallet.healthPoints < 100" @tap="convertPoints">100健康积分 → 5M币</button><view class="reward-grid"><view v-for="reward in visibleRewards" :key="reward.id"><view>{{ reward.icon }}</view><text>{{ reward.name }}</text><text>{{ reward.description }}</text><button :disabled="!canRedeem(reward)" @tap="redeemReward(reward)">{{ reward.cost }}{{ reward.audience === 'mem' ? 'M币' : '积分' }}</button></view></view><view v-if="redemptions.length" class="redemption-list"><text class="form-title">兑换记录</text><text v-for="record in redemptions" :key="record.id">{{ record.rewardName }} · -{{ record.cost }}{{ record.currency === 'm-coins' ? 'M币' : '积分' }}</text></view></view>

          <view v-else-if="detailView === 'prototype-policy'" class="detail-content" data-testid="policy-console"><DetailIntro kicker="本地原型配置台" title="训练状态策略" copy="普通用户固定关闭；配置仅作用于患者计划。" /><view class="policy-version"><view><text>{{ policyDraft.status === 'published' ? '已发布' : '草稿' }} v{{ policyDraft.version }}</text><text>当前生效 v{{ publishedPolicy.version }}</text></view><button @tap="publishPolicy">发布新版本</button></view><view class="policy-phase"><text>训练前状态</text><view><button v-for="item in assessmentModes" :key="item.id" :class="{ active: policyDraft.preMode === item.id }" @tap="setPolicyMode('pre',item.id)">{{ item.label }}</button></view></view><view class="policy-phase"><text>训练后状态</text><view><button v-for="item in assessmentModes" :key="item.id" :class="{ active: policyDraft.postMode === item.id }" @tap="setPolicyMode('post',item.id)">{{ item.label }}</button></view></view><view class="policy-fields"><text class="form-title">采集字段</text><label v-for="field in policyFieldOptions" :key="field.id"><view><text>{{ field.label }}</text><text>{{ field.copy }}</text></view><switch :checked="policyDraft.fields[field.id]" color="#11866F" @change="setPolicyField(field.id,$event)" /></label></view><view class="policy-source"><text class="form-title">来源优先级</text><text>医院/直接设备 → Apple健康/Health Connect → 手动录入 → 演示设备</text></view><view class="scenario-section"><text class="form-title">一键生成演示数据</text><view><button @tap="seedScenario('stable')">稳定</button><button @tap="seedScenario('attention')">需关注</button><button @tap="seedScenario('stop')">危险症状</button><button @tap="seedScenario('insufficient')">数据不足</button></view><text>仅写入小喜鹊本地原型。</text></view></view>

          <view v-else-if="detailView === 'doctor-reviews'" class="detail-content" data-testid="doctor-review-console"><DetailIntro kicker="本地医生工作台" title="建议审核" :copy="pendingReviewCount + ' 条建议等待确认，未经确认不会修改患者计划。'" /><view class="review-list"><view v-for="review in doctorReviews" :key="review.id"><view class="review-head"><view><text>{{ adviceForReview(review)?.title || '运动建议' }}</text><text>{{ formatDateTime(review.createdAt) }}</text></view><text>{{ reviewStatusLabel(review.status) }}</text></view><text>{{ review.proposedChange }}</text><view v-if="review.status === 'pending'"><button @tap="resolveReview(review.id,'approved')">同意调整</button><button @tap="resolveReview(review.id,'maintained')">维持计划</button><button @tap="resolveReview(review.id,'rejected')">驳回</button></view></view><view v-if="!doctorReviews.length" class="empty-card">暂无待审核建议。</view></view></view>

          <view v-else-if="detailView === 'knowledge-article'" class="detail-content"><image class="knowledge-cover" :src="selectedKnowledgeItem.poster" mode="aspectFill" /><DetailIntro kicker="精选指南" :title="selectedKnowledgeItem.title" :copy="selectedKnowledgeItem.summary" /><view class="article-body"><text v-for="(paragraph,index) in selectedKnowledgeItem.body" :key="index">{{ paragraph }}</text></view><text class="knowledge-boundary">原型内容待医学审核，不替代医生诊断或处方。</text></view>
          <view v-else-if="detailView === 'knowledge-video'" class="detail-content"><video class="knowledge-video" :src="selectedKnowledgeItem.video" :poster="selectedKnowledgeItem.poster" :controls="true" object-fit="contain" /><DetailIntro kicker="健康短视频" :title="selectedKnowledgeItem.title" :copy="selectedKnowledgeItem.summary" /><text class="knowledge-boundary">视频为原型素材，动作与内容待医学审核。</text></view>
        </scroll-view>
      </view>
    </template>

    <view v-if="showAiBoundary" class="modal-mask" @tap="showAiBoundary = false"><view class="modal-card" @tap.stop><text>健康助手边界</text><text>小喜只提供健康教育、数据来源说明和规则化建议。它不能诊断疾病、调整药物或直接修改医院处方。</text><button @tap="showAiBoundary = false">我知道了</button></view></view>
    <view v-if="showStopReason" class="modal-mask"><view class="modal-card danger-modal"><text>哪里不舒服？</text><text>选择后立即停止，不会扣积分。</text><button v-for="item in symptomOptions.slice(0,3)" :key="item.value" @tap="stopTraining(item.label)">{{ item.label }}</button><button class="cancel" @tap="showStopReason = false">返回训练</button></view></view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import AssistantPanel from '@/components/AssistantPanel.vue'
import CompanionHub from '@/components/CompanionHub.vue'
import DetailIntro from '@/components/DetailIntro.vue'
import KnowledgeHub from '@/components/KnowledgeHub.vue'
import MagpieMotion from '@/components/MagpieMotion.vue'
import StepIndicator from '@/components/StepIndicator.vue'
import TrainingExperience from '@/components/TrainingExperience.vue'
import { activities } from '@/lib/rive-motion'
import { isPrescriptionExercise, isSupportedPatientNo, sharedPatientFixture } from '@/lib/shared-patient'
import {
  exerciseCategories, exerciseGames, knowledgeItems, navItems, patientMetrics, publicMetrics, rewardItems, rewardMilestones, trendBars,
  type AdviceLevel, type AIAdvice, type AssessmentMode, type BuddyState, type CheckInRecord, type DataQuality, type DataSource,
  type DetailView, type DoctorReview, type ExerciseCategoryId, type ExerciseGameId, type MemEntitlement, type NavId,
  type RedemptionRecord, type ReviewStatus, type RewardItem, type RewardLedger, type TeamState, type TrainingAssessment,
  type TrainingAssessmentPolicy, type TrainingSession, type TrainingStatus, type UserMode, type VitalSnapshot, type WalletState,
} from '@/lib/prototype-data'

type OnboardingStep = 'mode' | 'binding'
type BindingState = 'idle' | 'loading' | 'matched' | 'error'
type DataTab = 'overview' | 'checkin' | 'history'
type HealthGoal = 'habit' | 'weight' | 'cardiac'
type SocialTab = 'none' | 'team' | 'buddy'
type ScenarioId = 'stable' | 'attention' | 'stop' | 'insufficient'

const STORAGE_KEY = 'magpie-prototype-state'
const magpieAsset = '/static/rive-source/v4/master/magpie-neutral-master-v4.png'
const appReady = ref(false)
const onboardingStep = ref<OnboardingStep>('mode')
const mode = ref<UserMode>('public')
const visitNumber = ref('')
const bindingState = ref<BindingState>('idle')
const activeNav = ref<NavId>('today')
const dataTab = ref<DataTab>('overview')
const detailView = ref<DetailView>('none')
const detailReturnNav = ref<NavId>('today')
const healthGoal = ref<HealthGoal>('habit')
const socialTab = ref<SocialTab>('none')
const selectedCategoryId = ref<ExerciseCategoryId>('traditional')
const selectedGameId = ref<ExerciseGameId>('baduanjin')
const selectedKnowledgeId = ref(knowledgeItems[0].id)
const selectedSessionId = ref('')
const trainingStatus = ref<TrainingStatus>('idle')
const elapsed = ref(0)
const repCount = ref(0)
const repStreak = ref(0)
const rhythmHits = ref(0)
const rhythmTotal = ref(0)
const rhythmCombo = ref(0)
const demoCompleted = ref(false)
const cameraStatus = ref<'idle' | 'requesting' | 'ready' | 'denied'>('idle')
const stoppedReason = ref('')
const pendingCheckInAward = ref(0)
const checkIns = ref<CheckInRecord[]>(buildSeedCheckIns())
const sessions = ref<TrainingSession[]>([])
const teamState = ref<TeamState>(createDefaultTeamState())
const buddyState = ref<BuddyState>(createDefaultBuddyState())
const calendarMonth = ref(monthKey(new Date()))
const rewardLedger = ref<RewardLedger>({ date: todayKey(), exerciseIds: [], prescriptionBonusAwarded: false })
const wallet = ref<WalletState>({ healthPoints: 160, mCoins: 0 })
const mem = ref<MemEntitlement>({ unlocked: false, inviteCode: 'MEM-2026' })
const memCode = ref('')
const redemptions = ref<RedemptionRecord[]>([])
const deviceConnected = ref(false)
const doctorReviews = ref<DoctorReview[]>([])
const planAdjustment = ref('')
const showAiBoundary = ref(false)
const showStopReason = ref(false)
const preSnapshot = ref<VitalSnapshot>(createVitalSnapshot('pre'))
const postSnapshot = ref<VitalSnapshot>(createVitalSnapshot('post'))
const policyDraft = ref<TrainingAssessmentPolicy>(createDefaultPolicy())
const publishedPolicy = ref<TrainingAssessmentPolicy>(createDefaultPolicy())
let trainingTimer: ReturnType<typeof setInterval> | undefined

const dataTabs: Array<{ id: DataTab; label: string }> = [{ id: 'overview', label: '概览' }, { id: 'checkin', label: '打卡' }, { id: 'history', label: '记录' }]
const assessmentModes: Array<{ id: AssessmentMode; label: string }> = [{ id: 'off', label: '关闭' }, { id: 'optional', label: '可选' }, { id: 'required', label: '必填' }]
const policyFieldOptions: Array<{ id: keyof TrainingAssessmentPolicy['fields']; label: string; copy: string }> = [
  { id: 'heartRate', label: '心率', copy: '设备自动采集' }, { id: 'oxygenSaturation', label: '血氧', copy: '设备自动采集' },
  { id: 'symptoms', label: '异常症状', copy: '用户主动报告' }, { id: 'borg', label: 'Borg用力感', copy: '0–10主观感受' },
  { id: 'feeling', label: '运动后感受', copy: '轻松/适中/较累' }, { id: 'bloodPressure', label: '血压', copy: '外接血压计或手动录入' },
]
const symptomOptions = [{ value: 'chest-pain', label: '胸痛或胸部不适' }, { value: 'dyspnea', label: '明显气促或呼吸困难' }, { value: 'dizzy', label: '头晕或意识异常' }, { value: 'palpitation', label: '持续或明显心悸' }]
const deviceSources = [{ id: 'apple-health', icon: '', name: 'Apple健康', copy: '心率、血氧与运动记录' }, { id: 'health-connect', icon: 'H', name: 'Health Connect', copy: 'Android健康数据授权' }, { id: 'demo-device', icon: '⌚', name: '智能手环 / 血氧仪', copy: '本地模拟设备适配器' }] as const

const prescriptionExerciseId = computed<ExerciseGameId | undefined>(() => sharedPatientFixture.prescription.items.find((item) => item.appExerciseId)?.appExerciseId as ExerciseGameId | undefined)
const featuredGame = computed(() => mode.value === 'cardiac' && prescriptionExerciseId.value ? exerciseGames.find((item) => item.id === prescriptionExerciseId.value) || exerciseGames[0] : exerciseGames[0])
const featuredActivity = computed(() => activities.find((item) => item.id === featuredGame.value.activityId) || activities[0])
const selectedGame = computed(() => exerciseGames.find((item) => item.id === selectedGameId.value) || exerciseGames[0])
const todayActivity = computed(() => activities.find((item) => item.id === selectedGame.value.activityId) || activities[0])
const selectedCategory = computed(() => exerciseCategories.find((item) => item.id === selectedCategoryId.value) || exerciseCategories[0])
const categoryGames = computed(() => exerciseGames.filter((item) => item.categoryId === selectedCategoryId.value))
const categoryRecommendedGame = computed(() => exerciseGames.find((item) => item.id === selectedCategory.value.recommendedGameId) || categoryGames.value[0])
const selectedKnowledgeItem = computed(() => knowledgeItems.find((item) => item.id === selectedKnowledgeId.value) || knowledgeItems[0])
const selectedSession = computed(() => sessions.value.find((item) => item.id === selectedSessionId.value) || sessions.value[0])
const latestAdvice = computed(() => sessions.value.find((item) => item.advice)?.advice)
const currentMetrics = computed(() => mode.value === 'cardiac' ? patientMetrics : publicMetrics)
const visibleMetrics = computed(() => currentMetrics.value.slice(0, 2))
const displayName = computed(() => mode.value === 'cardiac' ? sharedPatientFixture.patient.maskedName : '运动伙伴')
const topbarTitle = computed(() => ({ today: `${greeting()}，${displayName.value}`, discover: '发现', assistant: '小喜', data: '数据', profile: '我的' }[activeNav.value]))
const todayLabel = computed(() => `${new Date().getMonth() + 1}月${new Date().getDate()}日 · ${mode.value === 'cardiac' ? '按计划安全运动' : '完成今天的一小步'}`)
const healthGoalLabel = computed(() => mode.value === 'cardiac' || healthGoal.value === 'cardiac' ? '完成心脏康复阶段计划' : healthGoal.value === 'weight' ? '用稳定运动支持健康减重' : '建立可持续的运动习惯')
const planReason = computed(() => mode.value === 'cardiac' ? `来自${sharedPatientFixture.hospital.shortName}的今日处方` : '先完成一个容易重复的小任务')
const trainingTargetSeconds = computed(() => selectedGame.value.durationMinutes * 60)
const formattedElapsed = computed(() => formatTimer(elapsed.value))
const activityScore = computed(() => selectedGame.value.interaction === 'camera-score' ? Math.min(96, 82 + Math.floor(elapsed.value / 15)) : selectedGame.value.interaction === 'rep-game' ? Math.round(repCount.value / 12 * 100) : Math.round(rhythmHits.value / Math.max(1, rhythmTotal.value) * 100))
const rhythmRound = computed(() => Math.min(3, Math.max(1, Math.ceil(rhythmTotal.value / 8))))
const isCurrentPrescription = computed(() => mode.value === 'cardiac' && isPrescriptionExercise(selectedGameId.value as 'baduanjin' | 'resistance' | 'music'))
const completedTodaySessions = computed(() => sessions.value.filter((item) => item.status === 'completed' && localDateKey(new Date(item.createdAt)) === todayKey()))
const completedExerciseCount = computed(() => new Set(completedTodaySessions.value.map((item) => item.exerciseId)).size)
const completedMinutes = computed(() => Math.round(completedTodaySessions.value.reduce((sum, item) => sum + item.durationSeconds, 0) / 60))
const taskCompleted = computed(() => completedTodaySessions.value.some((item) => item.exerciseId === featuredGame.value.id))
const checkInDone = computed(() => checkIns.value.some((item) => item.date === todayKey()))
const streak = computed(() => calculateStreak(checkIns.value))
const totalCheckInDays = computed(() => new Set(checkIns.value.map((item) => item.date)).size)
const weeklyCompletedDays = computed(() => weeklyPlanDays.value.filter((item) => item.done).length)
const weeklyPlanDays = computed(() => {
  const todayIndex = (new Date().getDay() + 6) % 7
  const monday = addLocalDays(new Date(), -todayIndex)
  return ['一','二','三','四','五','六','日'].map((label,index) => {
    const date = addLocalDays(monday,index); const game = exerciseGames[[0,2,3,4,7,5,6][index]]
    return { label, index: index + 1, gameId: game.id, game, today: index === todayIndex, done: checkIns.value.some((item) => item.date === localDateKey(date)) }
  })
})
const currentMonthKey = computed(() => monthKey(new Date()))
const calendarTitle = computed(() => { const [year,month] = calendarMonth.value.split('-').map(Number); return `${year}年${month}月` })
const calendarCells = computed(() => buildCalendarCells(calendarMonth.value, checkIns.value))
const canGoNextMonth = computed(() => calendarMonth.value < currentMonthKey.value)
const teamJoined = computed(() => teamState.value.joined)
const teamMembers = computed(() => [{ id: 'self', name: '我', status: checkInDone.value ? '今日已打卡' : '今日待打卡', streak: streak.value, self: true }, { id: 'kang', name: '康姐', status: '今日已打卡', streak: 12, self: false }, { id: 'dong', name: '小动', status: '今日待打卡', streak: 4, self: false }, { id: 'lin', name: '林叔', status: '今日已打卡', streak: 9, self: false }])
const teamCheckedCount = computed(() => teamMembers.value.filter((item) => item.status === '今日已打卡').length)
const teamProgress = computed(() => Math.round(teamCheckedCount.value / teamMembers.value.length * 100))
const buddyDay = computed(() => buddyState.value.startedAt ? Math.min(buddyState.value.cycleDays, Math.max(1, Math.floor((startOfLocalDay(new Date()).getTime() - parseDateKey(buddyState.value.startedAt).getTime()) / 86400000) + 1)) : 1)
const preReady = computed(() => snapshotReady(preSnapshot.value, 'pre'))
const postReady = computed(() => snapshotReady(postSnapshot.value, 'post'))
const pendingReviewCount = computed(() => doctorReviews.value.filter((item) => item.status === 'pending').length)
const memChallengeDays = computed(() => calculateMemChallengeDays())
const visibleRewards = computed(() => rewardItems.filter((item) => item.audience === 'all' || (item.audience === 'cardiac' && mode.value === 'cardiac') || (item.audience === 'mem' && mem.value.unlocked)))
const detailTitle = computed(() => ({ precheck: '训练前状态', training: selectedGame.value.title, postcheck: '训练后状态', 'session-report': '运动解读', 'health-archive': '健康档案', devices: '设备与授权', 'knowledge-article': '指南', 'knowledge-video': '短视频', 'reward-store': '健康权益', 'weekly-path': '本周路径', 'exercise-category': selectedCategory.value.title, 'prototype-policy': '训练状态策略', 'doctor-reviews': '医生审核', 'hospital-report': '医院记录', none: '' }[detailView.value]))

function pad(value: number) { return String(value).padStart(2, '0') }
function localDateKey(date: Date) { return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}` }
function todayKey() { return localDateKey(new Date()) }
function monthKey(date: Date) { return `${date.getFullYear()}-${pad(date.getMonth()+1)}` }
function startOfLocalDay(date: Date) { return new Date(date.getFullYear(),date.getMonth(),date.getDate()) }
function addLocalDays(date: Date, amount: number) { const next = startOfLocalDay(date); next.setDate(next.getDate()+amount); return next }
function parseDateKey(value: string) { const [year,month,day] = value.split('-').map(Number); return new Date(year,Math.max(0,month-1),day||1) }
function greeting() { const hour = new Date().getHours(); return hour < 12 ? '上午好' : hour < 18 ? '下午好' : '晚上好' }
function formatTimer(value: number) { return `${pad(Math.floor(value/60))}:${pad(value%60)}` }
function formatDuration(value: number) { return value >= 60 ? `${Math.floor(value/60)}分${value%60 ? value%60+'秒' : ''}` : `${value}秒` }
function formatDateTime(value: string) { const date = new Date(value); return `${date.getMonth()+1}月${date.getDate()}日 ${pad(date.getHours())}:${pad(date.getMinutes())}` }
function formatTime(value: string) { const date = new Date(value); return `${pad(date.getHours())}:${pad(date.getMinutes())}` }
function sourceLabel(source: DataSource) { return ({ 'hospital-device': '医院/直接设备', 'apple-health': 'Apple健康', 'health-connect': 'Health Connect', manual: '手动录入', 'demo-device': '模拟设备适配器' }[source]) }
function qualityLabel(quality: DataQuality) { return ({ valid: '数据有效', stale: '数据已过期', missing: '暂无数据', denied: '未授权' }[quality]) }
function modeLabel(value: AssessmentMode) { return ({ off: '关闭', optional: '可选', required: '必填' }[value]) }
function adviceLevelLabel(level: AdviceLevel) { return ({ stable: '稳定', attention: '需关注', stop: '立即停止', insufficient: '数据不足' }[level]) }
function reviewStatusLabel(status: ReviewStatus) { return ({ pending: '待审核', approved: '已同意', rejected: '已驳回', maintained: '维持计划' }[status]) }
function snapshotSummary(snapshot?: VitalSnapshot) { if (!snapshot || snapshot.quality !== 'valid') return '数据不足'; return `心率 ${snapshot.heartRate ?? '--'} · 血氧 ${snapshot.oxygenSaturation ?? '--'}% · Borg ${snapshot.borg ?? '--'}` }

function createDefaultPolicy(): TrainingAssessmentPolicy { const now = new Date().toISOString(); return { id: 'POLICY-CARDIAC-DEMO', version: 1, status: 'published', audience: 'cardiac', preMode: 'required', postMode: 'required', fields: { heartRate: true, oxygenSaturation: true, symptoms: true, borg: true, feeling: true, bloodPressure: false }, preValidMinutes: 10, postWindowMinutes: 5, sourcePriority: ['hospital-device','apple-health','health-connect','manual','demo-device'], updatedAt: now, publishedAt: now } }
function createVitalSnapshot(phase: 'pre'|'post', quality: DataQuality = 'valid'): VitalSnapshot { const now = new Date().toISOString(); return { phase, heartRate: phase === 'pre' ? 68 : 76, oxygenSaturation: 98, borg: phase === 'pre' ? 1 : 3, feeling: phase === 'post' ? '适中' : undefined, symptoms: [], source: 'demo-device', measuredAt: now, syncedAt: now, quality } }
function buildSeedCheckIns(count=6): CheckInRecord[] { return Array.from({length:count},(_,index) => { const date=addLocalDays(new Date(),index-count); return { date:localDateKey(date), source:'legacy-demo', exerciseId:'baduanjin', pointsAwarded:5, createdAt:`${localDateKey(date)}T08:00:00` } }) }
function createDefaultTeamState(): TeamState { return { joined:false, teamId:'TEAM-XQ-7DAY', name:'小喜鹊7天轻运动队', inviteCode:'XQ-7DAY', reminderDates:{} } }
function createDefaultBuddyState(): BuddyState { return { connected:false, buddyId:'BUDDY-KANG', buddyName:'康康', cycleDays:7, startedAt:'', reminderSentDate:'' } }
function calculateStreak(records: CheckInRecord[]) { const dates=new Set(records.map((item)=>item.date)); let cursor=startOfLocalDay(new Date()); if(!dates.has(localDateKey(cursor))) cursor=addLocalDays(cursor,-1); let count=0; while(dates.has(localDateKey(cursor))){count+=1;cursor=addLocalDays(cursor,-1)} return count }
function buildCalendarCells(value:string,records:CheckInRecord[]){ const [year,month]=value.split('-').map(Number); const first=new Date(year,month-1,1); const leading=(first.getDay()+6)%7; const daysInMonth=new Date(year,month,0).getDate(); const checked=new Set(records.map((item)=>item.date)); const blanks=Array.from({length:leading},(_,index)=>({key:`blank-${index}`,day:0,blank:true,checked:false,today:false,future:false})); const days=Array.from({length:daysInMonth},(_,index)=>{const date=new Date(year,month-1,index+1);const key=localDateKey(date);return{key,day:index+1,blank:false,checked:checked.has(key),today:key===todayKey(),future:date.getTime()>startOfLocalDay(new Date()).getTime()}});return[...blanks,...days] }
function migrateCheckIns(saved: Record<string, any>): CheckInRecord[] { if(Array.isArray(saved.checkIns)&&saved.checkIns.length){const unique=new Map<string,CheckInRecord>();saved.checkIns.forEach((item:Partial<CheckInRecord>)=>{if(!item.date||!/^\d{4}-\d{2}-\d{2}$/.test(item.date))return;unique.set(item.date,{date:item.date,source:item.source==='core-exercise'?'core-exercise':'legacy-demo',exerciseId:item.exerciseId,pointsAwarded:Number(item.pointsAwarded)||0,createdAt:item.createdAt||`${item.date}T08:00:00`})});return[...unique.values()]} return buildSeedCheckIns() }

function chooseMode(value: UserMode){mode.value=value;if(value==='cardiac'){healthGoal.value='cardiac';onboardingStep.value='binding'}else{healthGoal.value='habit';enterApp()}}
function backToMode(){onboardingStep.value='mode';bindingState.value='idle';visitNumber.value=''}
function bindPatient(){if(bindingState.value==='matched'){enterApp();return}bindingState.value='loading';setTimeout(()=>{bindingState.value=isSupportedPatientNo(visitNumber.value)?'matched':'error'},420)}
function enterApp(){appReady.value=true;activeNav.value='today';persistState()}
function switchMode(){appReady.value=false;onboardingStep.value='mode';bindingState.value='idle';detailView.value='none';activeNav.value='today'}
function setHealthGoal(goal: HealthGoal){if(mode.value==='cardiac')return;healthGoal.value=goal;persistState()}
function goDetail(view: DetailView){if(view!=='training')stopTimer();detailReturnNav.value=activeNav.value;detailView.value=view}
function closeDetail(){stopTimer();detailView.value='none';activeNav.value=detailReturnNav.value}
function openData(tab: DataTab){dataTab.value=tab;activeNav.value='data'}
function handleTodayPrimary(){taskCompleted.value?openLatestReport():selectExercise(featuredGame.value.id)}
function openCategory(id: ExerciseCategoryId){selectedCategoryId.value=id;goDetail('exercise-category')}
function openKnowledgeItem(item: typeof knowledgeItems[number]){selectedKnowledgeId.value=item.id;detailReturnNav.value='discover';detailView.value=item.type==='video'?'knowledge-video':'knowledge-article'}
function openSession(session: TrainingSession){selectedSessionId.value=session.id;detailReturnNav.value='data';detailView.value='session-report'}
function openLatestReport(){if(!sessions.value.length){openData('history');return}selectedSessionId.value=sessions.value[0].id;goDetail('session-report')}
function shiftCalendarMonth(amount:number){const[year,month]=calendarMonth.value.split('-').map(Number);const next=new Date(year,month-1+amount,1);const key=monthKey(next);if(key<=currentMonthKey.value)calendarMonth.value=key}

function resetTraining(){stopTimer();trainingStatus.value='idle';elapsed.value=0;repCount.value=0;repStreak.value=0;rhythmHits.value=0;rhythmTotal.value=0;rhythmCombo.value=0;demoCompleted.value=false;cameraStatus.value='idle';stoppedReason.value='';pendingCheckInAward.value=0;preSnapshot.value=createVitalSnapshot('pre');postSnapshot.value=createVitalSnapshot('post')}
function selectExercise(id:ExerciseGameId){detailReturnNav.value=activeNav.value;selectedGameId.value=id;resetTraining();if(mode.value==='cardiac'&&publishedPolicy.value.preMode!=='off'){trainingStatus.value='checking';detailView.value='precheck'}else startTraining()}
function startTraining(){if(preSnapshot.value.symptoms.length)return;detailView.value='training';trainingStatus.value='active';elapsed.value=0;startTimer()}
function skipPre(){preSnapshot.value.quality='missing';startTraining()}
function skipPost(){postSnapshot.value.quality='missing';generateReport()}
function startTimer(){stopTimer();trainingTimer=setInterval(()=>{if(trainingStatus.value==='active'){elapsed.value+=1;if(elapsed.value>=trainingTargetSeconds.value)finishTraining(false)}},1000)}
function stopTimer(){if(trainingTimer)clearInterval(trainingTimer);trainingTimer=undefined}
function toggleTraining(){trainingStatus.value=trainingStatus.value==='paused'?'active':'paused'}
function recordRep(){if(trainingStatus.value!=='active'||repCount.value>=12)return;repCount.value+=1;repStreak.value+=1}
function recordBeat(){if(trainingStatus.value!=='active'||rhythmHits.value>=24)return;rhythmTotal.value+=1;if(rhythmTotal.value%7===0)rhythmCombo.value=0;else{rhythmHits.value+=1;rhythmCombo.value+=1}}
function finishTraining(isDemo:boolean){if(isDemo){elapsed.value=trainingTargetSeconds.value;if(selectedGame.value.interaction==='rep-game'){repCount.value=12;repStreak.value=12}if(selectedGame.value.interaction==='rhythm-game'){rhythmHits.value=24;rhythmTotal.value=26;rhythmCombo.value=8}demoCompleted.value=true}stopTimer();trainingStatus.value='completed';pendingCheckInAward.value=autoCheckInCoreExercise();if(mode.value==='cardiac'&&publishedPolicy.value.postMode!=='off')detailView.value='postcheck';else generateReport()}
function stopTraining(reason:string){stopTimer();showStopReason.value=false;trainingStatus.value='stopped';stoppedReason.value=reason;postSnapshot.value.symptoms=[reason];if(mode.value==='cardiac'&&publishedPolicy.value.postMode!=='off')detailView.value='postcheck';else generateReport()}
function stopBeforeStart(){trainingStatus.value='stopped';stoppedReason.value=preSnapshot.value.symptoms[0]||'训练前报告不适';elapsed.value=0;generateReport()}
function updatePreSymptoms(event:{detail:{value:string[]}}){preSnapshot.value.symptoms=event.detail.value}
function setSnapshotBorg(phase:'pre'|'post',event:any){const target=phase==='pre'?preSnapshot:postSnapshot;target.value.borg=Number(event.detail.value)}
function setPostFeeling(feeling:string){postSnapshot.value.feeling=feeling as VitalSnapshot['feeling']}
function simulateVitalSync(phase:'pre'|'post'){const target=phase==='pre'?preSnapshot:postSnapshot;target.value=createVitalSnapshot(phase);deviceConnected.value=true;persistState();uni.showToast({title:'已同步模拟设备数据',icon:'none'})}
function useManualSnapshot(phase:'pre'|'post'){const target=phase==='pre'?preSnapshot:postSnapshot;target.value.source='manual';target.value.measuredAt=new Date().toISOString();target.value.syncedAt=target.value.measuredAt;target.value.quality='valid';persistState();uni.showToast({title:'已标记为外部设备读数',icon:'none'})}
function snapshotReady(snapshot:VitalSnapshot,phase:'pre'|'post'){if(snapshot.quality!=='valid'&&(publishedPolicy.value.fields.heartRate||publishedPolicy.value.fields.oxygenSaturation))return false;if(publishedPolicy.value.fields.heartRate&&!Number.isFinite(snapshot.heartRate))return false;if(publishedPolicy.value.fields.oxygenSaturation&&!Number.isFinite(snapshot.oxygenSaturation))return false;if(publishedPolicy.value.fields.borg&&!Number.isFinite(snapshot.borg))return false;if(phase==='post'&&publishedPolicy.value.fields.feeling&&!snapshot.feeling)return false;return true}
function autoCheckInCoreExercise(){if(selectedGameId.value!==featuredGame.value.id||checkInDone.value||trainingStatus.value!=='completed')return 0;const record:CheckInRecord={date:todayKey(),source:'core-exercise',exerciseId:selectedGameId.value,pointsAwarded:5,createdAt:new Date().toISOString()};checkIns.value.push(record);wallet.value.healthPoints+=5;return 5}
function resultItems(){if(selectedGame.value.interaction==='camera-score')return[{label:'动作模拟评分',value:`${activityScore.value}分`},{label:'AR互动',value:selectedGame.value.arSupported?'支持':'未启用'}];if(selectedGame.value.interaction==='rep-game')return[{label:'完成次数',value:`${repCount.value}/12`},{label:'连续完成',value:`${repStreak.value}次`}];return[{label:'节拍命中',value:`${rhythmHits.value}/${rhythmTotal.value}`},{label:'完成组数',value:`${rhythmRound.value}/3`}]}
function buildAssessment():TrainingAssessment|undefined{if(mode.value!=='cardiac'||(publishedPolicy.value.preMode==='off'&&publishedPolicy.value.postMode==='off'))return undefined;const pre=publishedPolicy.value.preMode==='off'?undefined:{...preSnapshot.value,symptoms:[...preSnapshot.value.symptoms]};const post=publishedPolicy.value.postMode==='off'?undefined:{...postSnapshot.value,symptoms:[...postSnapshot.value.symptoms]};const complete=(!pre||snapshotReady(pre,'pre'))&&(!post||snapshotReady(post,'post'));let comparison='状态数据不完整，不生成确定性变化结论。';if(complete&&pre&&post)comparison=`心率变化 ${Number(post.heartRate)-Number(pre.heartRate)} 次/分，血氧变化 ${Number(post.oxygenSaturation)-Number(pre.oxygenSaturation)} 个百分点。`;else if(complete&&pre)comparison='仅记录训练前状态，不生成训练前后变化结论。';else if(complete&&post)comparison='仅记录训练后状态，不生成训练前后变化结论。';return{id:`ASSESS-${Date.now()}`,policyVersion:publishedPolicy.value.version,pre,post,completeness:complete?'complete':pre||post?'partial':'missing',comparison}}
function buildAdvice(sessionId:string,assessment?:TrainingAssessment):AIAdvice{const now=new Date().toISOString();const boundary='本建议用于健康教育与原型演示，不替代医生诊断或处方。';if(trainingStatus.value==='stopped'||stoppedReason.value){return{id:`ADVICE-${Date.now()}`,sessionId,level:'stop',title:'请立即停止并关注身体信号',summary:`已记录“${stoppedReason.value||'身体不适'}”，本次不计完成和积分。`,evidence:['用户主动报告危险症状','安全停止优先于运动目标'],actions:['停止运动并休息','症状明显、持续或加重时及时就医','紧急情况呼叫120'],sourceSummary:'依据：用户报告、训练停止记录与医院安全规则。',boundary,ruleVersion:'RULE-DEMO-1.0',createdAt:now}}
  if(mode.value==='public'){return{id:`ADVICE-${Date.now()}`,sessionId,level:'stable',title:'今天的运动已记录',summary:'保持当前节奏即可，不需要为了积分额外加量。',evidence:[`完成${selectedGame.value.duration}`,`连续行动${streak.value}天`],actions:['正常补水和休息','明天继续本周路径'],sourceSummary:'依据：运动时长、完成状态与打卡记录。',boundary,ruleVersion:'RULE-DEMO-1.0',createdAt:now}}
  if(publishedPolicy.value.preMode==='off'&&publishedPolicy.value.postMode==='off'){return{id:`ADVICE-${Date.now()}`,sessionId,level:'stable',title:'本次运动已记录',summary:'训练状态采集已关闭，本次不判断身体变化。',evidence:[`完成${selectedGame.value.duration}`,`使用策略 v${publishedPolicy.value.version}`],actions:['完成缓和、补水与休息','按医院计划进行下一次训练'],sourceSummary:'依据：运动完成状态与当前医院策略；未使用身体数值。',boundary,ruleVersion:'RULE-DEMO-1.0',createdAt:now}}
  if(!assessment||assessment.completeness!=='complete'){return{id:`ADVICE-${Date.now()}`,sessionId,level:'insufficient',title:'状态数据不足',summary:'本次记录已保存，但无法判断训练前后的身体变化。',evidence:['设备数据缺失、过期或未授权'],actions:['重新同步设备','必要时补充外部设备读数','不根据本次数据调整计划'],sourceSummary:'依据：数据完整性规则。',boundary,ruleVersion:'RULE-DEMO-1.0',createdAt:now}}
  const pre=assessment.pre;const post=assessment.post;const attention=Boolean(pre&&post&&((post.oxygenSaturation??100)<95||(pre.oxygenSaturation??100)<95||Math.abs((post.heartRate??0)-(pre.heartRate??0))>20||(post.borg??0)>=6||post.feeling==='较累'))
  if(attention)return{id:`ADVICE-${Date.now()}`,sessionId,level:'attention',title:'恢复状态需要关注',summary:'训练后数据超出该演示患者的个体范围，建议休息、复测并等待医生确认。',evidence:[assessment.comparison,`运动后Borg ${post?.borg??'--'}`,`数据来源：${sourceLabel(post?.source||'demo-device')}`].slice(0,3),actions:['今天不再额外加量','休息后重新测量','将降低强度建议提交医生审核'],sourceSummary:'依据：医院患者演示范围、前后变化与数据质量。',boundary,ruleVersion:'RULE-DEMO-1.0',createdAt:now}
  return{id:`ADVICE-${Date.now()}`,sessionId,level:'stable',title:'本次状态稳定',summary:'训练前后数据处于该演示患者的个体范围，可维持当前计划。',evidence:[assessment.comparison,`运动后Borg ${post?.borg??'--'}`,`数据来源：${sourceLabel(post?.source||'demo-device')}`].slice(0,3),actions:['完成缓和与补水','维持下一次计划'],sourceSummary:'依据：医院患者演示范围、前后变化与数据质量。',boundary,ruleVersion:'RULE-DEMO-1.0',createdAt:now}
}
function generateReport(){if(rewardLedger.value.date!==todayKey())rewardLedger.value={date:todayKey(),exerciseIds:[],prescriptionBonusAwarded:false};let awarded=0;if(trainingStatus.value==='completed'&&!rewardLedger.value.exerciseIds.includes(selectedGameId.value)){awarded+=10;rewardLedger.value.exerciseIds.push(selectedGameId.value)}if(trainingStatus.value==='completed'&&isCurrentPrescription.value&&!rewardLedger.value.prescriptionBonusAwarded){awarded+=10;rewardLedger.value.prescriptionBonusAwarded=true}wallet.value.healthPoints+=awarded;const id=`SESSION-${Date.now()}`;const assessment=buildAssessment();const advice=buildAdvice(id,assessment);const session:TrainingSession={id,exerciseId:selectedGameId.value,title:selectedGame.value.title,mode:mode.value,planType:isCurrentPrescription.value?'prescription':'self-directed',status:trainingStatus.value,durationSeconds:Math.min(trainingTargetSeconds.value,elapsed.value),demoCompleted:demoCompleted.value,stoppedReason:stoppedReason.value||undefined,score:activityScore.value,results:resultItems(),createdAt:new Date().toISOString(),pointsAwarded:awarded+pendingCheckInAward.value,policyVersion:mode.value==='cardiac'?publishedPolicy.value.version:undefined,assessment,advice};sessions.value.unshift(session);selectedSessionId.value=id;if(mode.value==='cardiac'&&(advice.level==='attention'||advice.level==='stop'))doctorReviews.value.unshift({id:`REVIEW-${Date.now()}`,sessionId:id,adviceId:advice.id,status:'pending',proposedChange:advice.level==='stop'?'暂停下一次计划，等待医生联系':'下一次缩短时长或改为呼吸放松',createdAt:new Date().toISOString()});pendingCheckInAward.value=0;evaluateMemChallenge();persistState();detailView.value='session-report'}

function setPolicyMode(phase:'pre'|'post',value:AssessmentMode){policyDraft.value={...policyDraft.value,[phase==='pre'?'preMode':'postMode']:value,status:'draft',updatedAt:new Date().toISOString()}}
function setPolicyField(field:keyof TrainingAssessmentPolicy['fields'],event:any){policyDraft.value={...policyDraft.value,status:'draft',updatedAt:new Date().toISOString(),fields:{...policyDraft.value.fields,[field]:Boolean(event.detail.value)}}}
function publishPolicy(){const now=new Date().toISOString();const next={...policyDraft.value,version:publishedPolicy.value.version+1,status:'published' as const,updatedAt:now,publishedAt:now,fields:{...policyDraft.value.fields},sourcePriority:[...policyDraft.value.sourcePriority]};publishedPolicy.value=next;policyDraft.value={...next,fields:{...next.fields},sourcePriority:[...next.sourcePriority]};persistState();uni.showToast({title:`策略v${next.version}已发布`,icon:'none'})}
function seedScenario(id:ScenarioId){const previousMode=mode.value;mode.value='cardiac';trainingStatus.value=id==='stop'?'stopped':'completed';stoppedReason.value=id==='stop'?'胸痛或胸部不适':'';preSnapshot.value=createVitalSnapshot('pre',id==='insufficient'?'stale':'valid');postSnapshot.value=createVitalSnapshot('post',id==='insufficient'?'missing':'valid');if(id==='attention'){postSnapshot.value.heartRate=101;postSnapshot.value.oxygenSaturation=94;postSnapshot.value.borg=6;postSnapshot.value.feeling='较累'}if(id==='stop')postSnapshot.value.symptoms=['胸痛或胸部不适'];elapsed.value=180;selectedGameId.value='baduanjin';const sessionId=`SESSION-DEMO-${Date.now()}`;const assessment=buildAssessment();const advice=buildAdvice(sessionId,assessment);const session:TrainingSession={id:sessionId,exerciseId:'baduanjin',title:'状态测试记录',mode:'cardiac',planType:'prescription',status:trainingStatus.value,durationSeconds:180,demoCompleted:true,stoppedReason:stoppedReason.value||undefined,score:id==='stop'?0:88,results:[{label:'测试场景',value:id}],createdAt:new Date().toISOString(),pointsAwarded:0,policyVersion:publishedPolicy.value.version,assessment,advice};sessions.value.unshift(session);selectedSessionId.value=sessionId;if(advice.level==='attention'||advice.level==='stop')doctorReviews.value.unshift({id:`REVIEW-${Date.now()}`,sessionId,adviceId:advice.id,status:'pending',proposedChange:advice.level==='stop'?'暂停下一次计划，等待医生联系':'下一次缩短时长或改为呼吸放松',createdAt:new Date().toISOString()});mode.value=previousMode;detailView.value='session-report';persistState();uni.showToast({title:'已生成本地演示记录',icon:'none'})}
function reviewForAdvice(adviceId:string){return doctorReviews.value.find((item)=>item.adviceId===adviceId)}
function adviceForReview(review:DoctorReview){return sessions.value.find((item)=>item.id===review.sessionId)?.advice}
function resolveReview(id:string,status:ReviewStatus){const review=doctorReviews.value.find((item)=>item.id===id);if(!review)return;review.status=status;review.reviewedAt=new Date().toISOString();if(status==='approved')planAdjustment.value=review.proposedChange;persistState()}

function simulateDeviceConnect(source:DataSource){deviceConnected.value=true;preSnapshot.value.source=source;postSnapshot.value.source=source;persistState();uni.showToast({title:'已完成模拟授权',icon:'none'})}
function createDemoTeam(){teamState.value={...createDefaultTeamState(),joined:true,name:'我的轻运动陪伴队',inviteCode:'XQ-MYTEAM'};persistState()}
function joinTeamByCode(code:string){if(code.trim().toUpperCase()!=='XQ-7DAY'){uni.showToast({title:'邀请码不正确',icon:'none'});return}joinDemoTeam()}
function joinDemoTeam(){teamState.value={...createDefaultTeamState(),joined:true};persistState()}
function remindTeamMember(memberId:string){if(teamState.value.reminderDates[memberId]===todayKey())return;teamState.value={...teamState.value,reminderDates:{...teamState.value.reminderDates,[memberId]:todayKey()}};persistState()}
function setBuddyCycle(days:7|30){buddyState.value={...buddyState.value,cycleDays:days};persistState()}
function connectDemoBuddy(){buddyState.value={...buddyState.value,connected:true,startedAt:todayKey()};persistState()}
function remindBuddy(){if(buddyState.value.reminderSentDate===todayKey())return;buddyState.value={...buddyState.value,reminderSentDate:todayKey()};persistState()}
function focusMemUnlock(){uni.showToast({title:'输入邀请码 MEM-2026',icon:'none'})}
function unlockMem(){if(memCode.value.trim().toUpperCase()!=='MEM-2026'){uni.showToast({title:'邀请码不正确',icon:'none'});return}mem.value={unlocked:true,inviteCode:'MEM-2026',unlockedAt:new Date().toISOString(),challengeStartDate:todayKey()};memCode.value='';persistState()}
function convertPoints(){if(wallet.value.healthPoints<100)return;wallet.value.healthPoints-=100;wallet.value.mCoins+=5;persistState()}
function canRedeem(reward:RewardItem){return reward.audience==='mem'?mem.value.unlocked&&wallet.value.mCoins>=reward.cost:wallet.value.healthPoints>=reward.cost}
function redeemReward(reward:RewardItem){if(!canRedeem(reward))return;const currency=reward.audience==='mem'?'m-coins':'health-points';if(currency==='m-coins')wallet.value.mCoins-=reward.cost;else wallet.value.healthPoints-=reward.cost;redemptions.value.unshift({id:`REDEEM-${Date.now()}`,rewardId:reward.id,rewardName:reward.name,currency,cost:reward.cost,createdAt:new Date().toISOString()});persistState();uni.showToast({title:'演示兑换成功',icon:'none'})}
function calculateMemChallengeDays(){let count=0;let cursor=startOfLocalDay(new Date());while(true){const key=localDateKey(cursor);const seconds=sessions.value.filter((item)=>item.status==='completed'&&localDateKey(new Date(item.createdAt))===key).reduce((sum,item)=>sum+item.durationSeconds,0);if(seconds<900)break;count+=1;cursor=addLocalDays(cursor,-1)}return count}
function evaluateMemChallenge(){if(!mem.value.unlocked)return;const days=calculateMemChallengeDays();if(days>0&&days%7===0&&mem.value.lastRewardCycleEnd!==todayKey()){wallet.value.mCoins+=20;mem.value.lastRewardCycleEnd=todayKey()}}

function persistState(){uni.setStorageSync(STORAGE_KEY,{schemaVersion:4,ready:appReady.value,mode:mode.value,healthGoal:healthGoal.value,wallet:wallet.value,mem:mem.value,redemptions:redemptions.value,checkIns:checkIns.value,teamState:teamState.value,buddyState:buddyState.value,sessions:sessions.value,rewardLedger:rewardLedger.value,deviceConnected:deviceConnected.value,policyDraft:policyDraft.value,publishedPolicy:publishedPolicy.value,doctorReviews:doctorReviews.value,planAdjustment:planAdjustment.value})}
function resetPrototype(){stopTimer();uni.removeStorageSync(STORAGE_KEY);appReady.value=false;onboardingStep.value='mode';mode.value='public';activeNav.value='today';detailView.value='none';wallet.value={healthPoints:160,mCoins:0};mem.value={unlocked:false,inviteCode:'MEM-2026'};redemptions.value=[];checkIns.value=buildSeedCheckIns();teamState.value=createDefaultTeamState();buddyState.value=createDefaultBuddyState();sessions.value=[];rewardLedger.value={date:todayKey(),exerciseIds:[],prescriptionBonusAwarded:false};deviceConnected.value=false;policyDraft.value=createDefaultPolicy();publishedPolicy.value=createDefaultPolicy();doctorReviews.value=[];planAdjustment.value=''}
onMounted(()=>{const saved=uni.getStorageSync(STORAGE_KEY);if(saved?.ready){mode.value=saved.mode==='cardiac'?'cardiac':'public';healthGoal.value=saved.healthGoal==='weight'?'weight':saved.healthGoal==='cardiac'?'cardiac':'habit';wallet.value=saved.wallet?{healthPoints:Number(saved.wallet.healthPoints)||0,mCoins:Number(saved.wallet.mCoins)||0}:{healthPoints:Number(saved.points)||160,mCoins:0};mem.value=saved.mem?{...mem.value,...saved.mem}:mem.value;redemptions.value=Array.isArray(saved.redemptions)?saved.redemptions:[];checkIns.value=migrateCheckIns(saved);teamState.value=saved.teamState?{...createDefaultTeamState(),...saved.teamState,reminderDates:saved.teamState.reminderDates||{}}:createDefaultTeamState();buddyState.value=saved.buddyState?{...createDefaultBuddyState(),...saved.buddyState}:createDefaultBuddyState();sessions.value=Array.isArray(saved.sessions)?saved.sessions:[];rewardLedger.value=saved.rewardLedger?.date?saved.rewardLedger:rewardLedger.value;deviceConnected.value=Boolean(saved.deviceConnected);publishedPolicy.value=saved.publishedPolicy?{...createDefaultPolicy(),...saved.publishedPolicy,fields:{...createDefaultPolicy().fields,...saved.publishedPolicy.fields}}:createDefaultPolicy();policyDraft.value=saved.policyDraft?{...publishedPolicy.value,...saved.policyDraft,fields:{...publishedPolicy.value.fields,...saved.policyDraft.fields}}:{...publishedPolicy.value,fields:{...publishedPolicy.value.fields}};doctorReviews.value=Array.isArray(saved.doctorReviews)?saved.doctorReviews:[];planAdjustment.value=saved.planAdjustment||'';appReady.value=true;activeNav.value='today';persistState()}})
onUnmounted(stopTimer)
</script>

<style lang="scss" src="./index.scss"></style>
